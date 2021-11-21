import { ConcertMetadata, PieceOrOtherState } from "./interfaces";
import { Status } from "./interfaces/OBS";

export interface ServerToClientEvents {
  withAck: (d: string, callback: (e: number) => void) => void;
  time: (date: Date) => void;
  concertState: (state: PieceOrOtherState) => void;
  concertData: (metadata: ConcertMetadata) => void;
}

export interface ClientToServerEvents {
  obsState: (state: Status) => void;
  slideState: (command: "next") => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  type: "overlay" | "presentation";
}
