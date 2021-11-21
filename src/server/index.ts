import { createServer } from "http";
import Koa from "koa";
import KoaRouter from "@koa/router";
import { Server } from "socket.io";
import { join } from "path";
import serveStatic from "koa-static";
import {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "../shared/socket";

import {
  firstValueFrom,
  from,
  fromEvent,
  map,
  mapTo,
  Observable,
  of,
  repeat,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  zip,
} from "rxjs";
import { Concert, ConcertMetadata, Piece } from "../shared/interfaces";

import yaml from "yaml";
import { readFile, watch } from "fs/promises";

async function main() {
  const app = new Koa();
  const server = createServer(app.callback());
  const socket = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(server);
  const koaRouter = new KoaRouter();

  const next = new Subject<"next">();
  const config = from(watch("./data/fvcconcert.yaml")).pipe(
    startWith({ filename: "" }),
    mapTo("./data/fvcconcert.yaml"),
    switchMap((v) => from(readFile(v, { encoding: "utf8" }))),
    map((v) => yaml.parse(v) as Concert),
    shareReplay(1)
  );

  const state = config.pipe(
    switchMap((v) =>
      zip(from(v.pieces as Omit<Piece, "type">[]), next, (a, b) => a).pipe(
        repeat()
      )
    ),
    shareReplay(1)
  );

  const metadata: Observable<ConcertMetadata> = of<ConcertMetadata>({
    name: "Winter Concert",
    group: {
      name: "Edinburgh University Female Voice Choir",
      logo: "logo.jpg",
    },
    date: new Date("2021-12-05T14:30:00.000Z"),
  });

  socket.on("connection", (conn) => {
    conn.data.type = "overlay";
    conn.on("obsState", console.log);

    state.subscribe((next) =>
      conn.emit("concertState", { type: "piece", ...next })
    );
    metadata.subscribe((next) => {
      conn.emit("concertData", next);
    });

    fromEvent(conn, "slideState", (v) => v as "next").subscribe(next);
  });

  const publicDir = join(process.cwd(), "public");

  app
    .use(serveStatic(publicDir, { extensions: ["html"] }))
    .use(koaRouter.routes())
    .use(koaRouter.allowedMethods());

  koaRouter.get("metadata", "/metadata", async (ctx, next) => {
    await next();
    ctx.response.type = "json";
    ctx.response.body = await firstValueFrom(config);
    ctx.response.status = 200;
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
