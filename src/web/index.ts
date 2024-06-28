import { socket } from "./socket";
import { OmniBar, Presentation } from "./controls";
import { map, Observable, throttleTime } from "rxjs";
import { obsStudio } from "../shared/interfaces/OBS";
import { gamepadButton$ } from "./joycon";

socket.on("connect", () => {
  if (obsStudio) {
    const getStatus = () =>
      obsStudio.getStatus((status) => {
        socket.emit("obsState", {
          replayBuffer: false,
          virtualCam: false,
          ...status,
        });
      });
    window.addEventListener("obsStreamingStarted", getStatus, {
      passive: true,
    });
    window.addEventListener("obsStreamingStopped", getStatus, {
      passive: true,
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

document.addEventListener("keypress", (ev) => {
  if (ev.key === "f") {
    document.body.requestFullscreen();
  } else if (ev.key === "n") {
    socket.emit("slideState", "next");
  } else if (ev.key === "p") {
    socket.emit("slideState", "previous");
  }
});

gamepadButton$.pipe(throttleTime(500)).subscribe((v) => {
  console.log(v);
  switch (v.value) {
    case 1:
    case 15:
      socket.emit("slideState", "next");
      break;
    case 2:
    case 13:
      socket.emit("slideState", "prev");
      break;
  }
});
