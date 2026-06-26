import { socket } from "./socket";
import { useWebRTC } from "./hooks/useWebRTC";
import { useFileTransfer } from "./hooks/useFileTransfer";
import { useState, useEffect } from "react";

const App = () => {
  const [roomId, setRoomId] = useState("");

  const {
    setupDataChannel,
    handleFileSelect,
    sendFile,
    downloadUrl,
    downloadName,
    progress,
  } = useFileTransfer();

  const { status, joinRoom } = useWebRTC(setupDataChannel);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Socket connected: ", socket.id);
    });
  }, []);

  return (
    <>
      <h2>WebRTC Share</h2>
      <input
        type="text"
        name="roomId"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        placeholder="room id"
      />
      <button onClick={() => joinRoom(roomId)}>Join Room</button>
      <p>Status: {status}</p>

      <input type="file" onChange={handleFileSelect} />
      <button onClick={sendFile} disabled={status !== "connected"}>
        Send File
      </button>

      {progress > 0 && progress < 100 && (
        <div>
          <progress value={progress} max={100} />
          <span>{progress}%</span>
        </div>
      )}

      {downloadUrl && (
        <a href={downloadUrl} download={downloadName}>
          Download {downloadName}
        </a>
      )}
    </>
  );
};

export default App;
