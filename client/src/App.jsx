import { socket } from "./socket";
import { useWebRTC } from "./hooks/useWebRTC";
import { useFileTransfer } from "./hooks/useFileTransfer";
import { useChat } from "./hooks/useChat";
import { useState, useEffect } from "react";

const App = () => {
  const [roomId, setRoomId] = useState("");
  const [chatInput, setChatInput] = useState("");

  const {
    setupDataChannel: setupDataChannelBase,
    handleFileSelect,
    sendFile,
    pauseTransfer,
    resumeTransfer,
    resetTransfer,
    dcRef,
    downloadUrl,
    downloadName,
    progress,
    pausedBy,
  } = useFileTransfer();

  const { messages, sendMessage, onChatMessage, resetMessages } =
    useChat(dcRef);

  const setupDataChannel = (channel) => {
    setupDataChannelBase(channel, onChatMessage);
  };

  const { status, joinRoom } = useWebRTC(setupDataChannel, () => {
    resetTransfer();
    resetMessages();
  });

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Socket connected: ", socket.id);
    });
  }, []);

  const handleSend = () => {
    sendMessage(chatInput);
    setChatInput("");
  };

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

          {pausedBy === null && <button onClick={pauseTransfer}>Pause</button>}
          {pausedBy === "self" && (
            <button onClick={resumeTransfer}>Resume</button>
          )}
          {pausedBy === "self" && <span>Paused by you</span>}
          {pausedBy === "peer" && <span>Paused by peer</span>}
        </div>
      )}

      {downloadUrl && (
        <a href={downloadUrl} download={downloadName}>
          Download {downloadName}
        </a>
      )}

      {/* Chat */}
      <div>
        <div>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{ textAlign: msg.self ? "right" : "left" }}
            >
              <span>{msg.text}</span>
              <span style={{ fontSize: "0.75rem", color: "gray" }}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          disabled={status !== "connected"}
        />
        <button onClick={handleSend} disabled={status !== "connected"}>
          Send
        </button>
      </div>
    </>
  );
};

export default App;
