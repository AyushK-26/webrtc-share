import { io } from "socket.io-client";
import { SIGNALING_URL } from "./constants";

export const socket = io(SIGNALING_URL);
