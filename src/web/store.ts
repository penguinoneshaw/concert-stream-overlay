import { Observable, shareReplay, startWith } from "rxjs";
import { ajax } from "rxjs/ajax";
import {
  Concert,
  ConcertMetadata,
  SharedState,
  Status,
} from "../shared/interfaces";
import { socket } from "./socket";

export const stateSubject = new Observable<SharedState | undefined>(function (
  subscriber
) {
  socket.on("concertState", (v) => subscriber.next(v));
  return () => {
    socket.off("concertState", (v) => subscriber.next(v));
  };
}).pipe(startWith(undefined), shareReplay(1));

export const metadataSubject = new Observable<ConcertMetadata>(function (
  subscriber
) {
  socket.on("concertData", (v) => subscriber.next(v));
  return () => {
    socket.off("concertData", (v) => subscriber.next(v));
  };
}).pipe(startWith(undefined), shareReplay(1));

export const obsStateSubject = new Observable<Status>(function (subscriber) {
  socket.on("obsState", (v) => subscriber.next(v));
  return () => {
    socket.off("obsState", (v) => subscriber.next(v));
  };
}).pipe(startWith(undefined), shareReplay(1));

export const fullConcertDataSubject = ajax
  .getJSON<Concert>("/metadata")
  .pipe(shareReplay({ bufferSize: 1, refCount: true }));
