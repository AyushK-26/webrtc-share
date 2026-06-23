import { error } from "console";
import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const PORT = 3000;

io.on("connection", (socket) => {
  console.log("connected: ", socket.id);

  socket.on("join-room", (roomId, callback) => {
    if (!roomId) {
      callback?.({ error: "room-id-required" });
      return;
    }

    const room = io.sockets.adapter.rooms.get(roomId);
    const peerCount = room?.size ?? 0;

    if (peerCount >= 2) {
      callback?.({ error: "room-full" });
      return;
    }

    socket.join(roomId);
    socket.data.roomId = roomId;

    if (peerCount === 0) {
      callback?.({ role: "host", peerCount: 1 });
      return;
    }

    socket.to(roomId).emit("peer-joined", { peerId: socket.id });
    callback?.({ role: "guest", peerCount: 2 });
  });

  // Replay Offer, Answer, ICE Candidates
  const relayToRoom = (event) => {
    socket.on(event, (payload) => {
      const roomId = payload?.roomId ?? socket.data.roomId;
      if (!roomId) return;

      socket.to(roomId).emit(event, {
        ...payload,
        senderId: socket.id,
      });
    });
  };

  relayToRoom("offer");
  relayToRoom("answer");
  relayToRoom("ice-candidate");

  socket.on("disconnect", () => {
    const { roomId } = socket.data;
    if (roomId) {
      socket.to(roomId).emit("peer-left", { peerId: socket.id });
    }
  });
});

app.get("/", (req, res) => {
  console.log("Home Route!");
});

server.listen(PORT, () => {
  console.log(`Server listening on PORT: ${PORT}`);
});
