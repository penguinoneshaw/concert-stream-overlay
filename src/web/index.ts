import { socket } from "./socket";
import { OmniBar, Presentation } from "./controls";
import { map, Observable } from "rxjs";
import { obsStudio } from "../shared/interfaces/OBS";
import { metadataSubject, stateSubject } from "./store";

socket.on("connect", () => {
  if (obsStudio) {
    obsStudio.getStatus((status) => {
      socket.emit("obsState", status);
    });
  }
});

const bar =
  (document.querySelector("streamer-presentation, streamer-omnibar") as
    | Presentation
    | OmniBar) ?? new Presentation();

if (!bar.isConnected) {
  document.body.append(bar);
}

const observable = new Observable<Date | string | undefined>(function (
  subscriber
) {
  socket.on("time", (v) => subscriber.next(v));
  socket.on("disconnect", () => subscriber.complete());
  return () => {
    socket.off("time");
  };
}).pipe(
  map((v) => new Date(v ?? Date())),
  map((v) => v.toISOString())
);

const subscription = observable.subscribe((next) => {
  bar.datetime = next;
});

socket.on("disconnect", (reason) => {
  console.log(reason);
  bar.datetime = undefined;

  subscription.unsubscribe();
});

stateSubject.subscribe((v) => {
  bar.currentState = v;
});

metadataSubject.subscribe((v) => {
  bar.metadata = v;
});

document.addEventListener("keypress", (ev) => {
  if (ev.key === "f") {
    document.body.requestFullscreen();
  } else if (ev.key === "n") {
    socket.emit("slideState", "next");
  }
});
