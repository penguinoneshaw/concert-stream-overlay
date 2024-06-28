import KoaRouter from "@koa/router";
import { createServer } from "http";
import Koa from "koa";
import KoaBodyParser from "koa-bodyparser";
import serveStatic from "koa-static";
import { join } from "path";
import { Server } from "socket.io";

import {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "../shared/socket";

import {
  BehaviorSubject,
  combineLatestWith,
  firstValueFrom,
  from,
  fromEvent,
  map,
  mapTo,
  Observable,
  of,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  tap,
} from "rxjs";
import {
  Concert,
  ConcertMetadata,
  OtherState,
  SharedState,
  Status,
} from "../shared/interfaces";

import { readFile, watch } from "fs/promises";
import yaml from "yaml";
import { generateNotesPDF } from "./pdf-merge";

const stateBlank: OtherState = {
  type: "State-Blank",
  stream: "",
  controls: "",
};

type StateKey = "next" | "previous" | string | number;

async function main() {
  const app = new Koa();
  app.use(KoaBodyParser());
  const server = createServer(app.callback());
  const socket = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(server);
  const koaRouter = new KoaRouter();
  const file = "./public/data/fvcconcert.yaml";
  const stateCommands = new Subject<StateKey>();
  const config = from(watch(file)).pipe(
    startWith({ filename: "" }),
    mapTo(file),
    switchMap((v) => from(readFile(v, { encoding: "utf8" }))),
    map((v) => yaml.parse(v) as Concert),
    shareReplay(1)
  );

  const states = config.pipe(
    switchMap((v) => of(v?.running_order ?? [])),
    shareReplay(1)
  );

  let currentIndex: number | undefined;

  const state: Observable<SharedState> = stateCommands.pipe(
    combineLatestWith(states),
    map(([StateKey, state]) => {
      let newKey = StateKey;
      if (typeof newKey === "number") {
        return newKey;
      } else if (newKey === "next" || newKey === "previous") {
        return newKey;
      } else if (typeof newKey === "string") {
        newKey =
          state.findIndex(
            (v) =>
              ((v.type === "piece" || v.type === undefined) &&
                v.title === newKey) ||
              v.type === newKey
          ) ?? undefined;
      }
      return newKey;
    }),
    combineLatestWith(states),
    map(([nextKey, stateArray]) => {
      let newKey: number | undefined;
      const previousKey = currentIndex;
      if (nextKey === "previous" || nextKey === "next") {
        if (typeof previousKey === "number" && stateArray.length > 0) {
          newKey =
            (previousKey + (nextKey === "next" ? 1 : -1)) % stateArray.length;
        } else {
          newKey = 0;
        }
      } else {
        newKey = nextKey;
      }
      return { newKey, stateArray };
    }),
    tap(({ newKey }) => (currentIndex = newKey)),
    map(({ newKey, stateArray }) =>
      newKey == null ? stateBlank : stateArray[newKey]
    ),
    shareReplay(1)
  );

  const metadata: Observable<ConcertMetadata> = config.pipe(
    map((value) => {
      const { name, group, price, date, venue, description, charity } =
        value ?? {};
      return { name, group, price, date, venue, description, charity };
    })
  );

  const obsState = new BehaviorSubject<Status | undefined>(undefined);

  socket.on("connection", (conn) => {
    conn.data.type = "overlay";
    conn.on("obsState", console.log);
    const connections = [
      state.subscribe((next) => conn.emit("concertState", next ?? stateBlank)),
      metadata.subscribe((next) => {
        conn.emit("concertData", next);
      }),
      fromEvent(conn, "obsState", (v) => v as Status).subscribe(obsState),
      fromEvent(conn, "slideState", (v) => v as StateKey).subscribe(
        stateCommands
      ),
      obsState.subscribe((next) => conn.emit("obsState", next)),
    ];
    conn.on("disconnect", () => connections.forEach((v) => v.unsubscribe()));
  });

  const publicDir = join(process.cwd(), "public");

  app
    .use(serveStatic(publicDir, { extensions: ["html", "ts"] }))
    .use(koaRouter.routes())
    .use(koaRouter.allowedMethods());

  koaRouter.get("metadata", "/metadata", async (ctx, next) => {
    await next();
    ctx.response.type = "json";
    ctx.response.body = await firstValueFrom(config);
    ctx.response.status = 200;
  });

  koaRouter.post("state", "/state", async (ctx, next) => {
    const body = ctx.request.body;
    console.log(body);
    if (
      body &&
      typeof body === "object" &&
      "newState" in body &&
      typeof body.newState === "string"
    )
      stateCommands.next(body.newState);
    ctx.response.status = 200;
    await next();
  });

  koaRouter.get("pdf", "/notes-pdf", async (ctx, next) => {
    const resultBlob = await generateNotesPDF(
      new URL("/notes", `${ctx.protocol}://${ctx.host}`).toString()
    );

    ctx.response.body = resultBlob;
    ctx.response.header["Content-Disposition"] =
      'attachment; filename="notes.pdf"';
    ctx.response.type = "application/pdf";
    ctx.response.status = 200;

    await next();
  });

  app.on("error", console.error);

  server.on("listening", () => {
    const addr = server.address();

    if (addr != null && typeof addr !== "string") {
      console.log(`http://127.0.0.1:${addr.port}`);
    }
  });
  server.listen(33200);
}

main().catch(console.error);
