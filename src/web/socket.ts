import { io, Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from "../shared/socket";

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io();
