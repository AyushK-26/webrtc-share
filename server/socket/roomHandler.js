export const registerRoomHandler = (io, socket) => {
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

  socket.on("leave-room", () => {
    const { roomId } = socket.data;
    if (!roomId) return;
    socket.to(roomId).emit("peer-left");
    socket.leave(roomId);
    socket.data.roomId = null;
  });

  socket.on("disconnect", () => {
    const { roomId } = socket.data;
    if (roomId) {
      socket.to(roomId).emit("peer-left", { peerId: socket.id });
    }
  });
};
