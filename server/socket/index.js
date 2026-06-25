import { registerRoomHandler } from "./roomHandler.js";
import { registerRelayHandler } from "./relayHandler.js";

export const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("connected: ", socket.id);
    registerRoomHandler(io, socket);
    registerRelayHandler(socket);
  });
};
