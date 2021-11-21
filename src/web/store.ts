import { Observable, shareReplay, startWith } from "rxjs";
import { ConcertMetadata, PieceOrOtherState } from "../shared/interfaces";
import { socket } from "./socket";

export const stateSubject = new Observable<PieceOrOtherState | undefined>(
  function (subscriber) {
    socket.on("concertState", (v) => subscriber.next(v));
    return () => {
      socket.off("concertState", (v) => subscriber.next(v));
    };
  }
).pipe(startWith(undefined), shareReplay(1));

export const metadataSubject = new Observable<ConcertMetadata>(function (
  subscriber
) {
  socket.on("concertData", (v) => subscriber.next(v));
  return () => {
    socket.off("concertData", (v) => subscriber.next(v));
  };
}).pipe(startWith(undefined), shareReplay(1));
