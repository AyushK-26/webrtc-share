export const registerRelayHandler = (socket) => {
  const relayToRoom = (event) => {
    socket.on(event, (payload) => {
      const roomId = socket.data.roomId;
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
};
