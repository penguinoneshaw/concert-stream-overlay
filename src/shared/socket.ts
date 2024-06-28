import { ConcertMetadata, SharedState } from "./interfaces";
import { Status } from "./interfaces/OBS";

export interface ServerToClientEvents {
  withAck: (d: string, callback: (e: number) => void) => void;
  time: (date: Date) => void;
  concertState: (state: SharedState) => void;
  concertData: (metadata: ConcertMetadata) => void;
  obsState: (state: Status | undefined) => void;
}

export interface ClientToServerEvents {
  obsState: (state: Status) => void;
  slideState: (command: "next" | "previous" | string | number) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  type: "overlay" | "presentation";
}
