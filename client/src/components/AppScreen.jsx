import { useEffect } from "react";
import { socket } from "../socket";
import { useWebRTC } from "../hooks/useWebRTC";
import { useFileTransfer } from "../hooks/useFileTransfer";
import { useChat } from "../hooks/useChat";
import Topbar from "./Topbar";
import FilePanel from "./FilePanel";
import ChatPanel from "./ChatPanel";

const AppScreen = ({ roomId, onLeave }) => {
  const {
    setupDataChannel: setupDataChannelBase,
    handleFileSelect,
    sendFile,
    pauseTransfer,
    resumeTransfer,
    resetTransfer,
    cancelTransfer,
    downloadUrl,
    downloadName,
    progress,
    pausedBy,
    transferCancelled,
    dcRef,
  } = useFileTransfer();

  const { messages, sendMessage, onChatMessage, resetMessages } =
    useChat(dcRef);

  const setupDataChannel = (channel) => {
    setupDataChannelBase(channel, onChatMessage);
  };

  const { status, joinRoom, leaveRoom } = useWebRTC(setupDataChannel, () => {
    resetTransfer();
    resetMessages();
  });

  useEffect(() => {
    joinRoom(roomId);
    return () => {
      leaveRoom();
    };
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-surface overflow-hidden">
      <Topbar status={status} roomId={roomId} onLeave={onLeave} />
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        <FilePanel
          status={status}
          progress={progress}
          pausedBy={pausedBy}
          downloadUrl={downloadUrl}
          downloadName={downloadName}
          transferCancelled={transferCancelled}
          onFileSelect={handleFileSelect}
          onSend={sendFile}
          onPause={pauseTransfer}
          onResume={resumeTransfer}
          onCancel={cancelTransfer}
        />
        <ChatPanel status={status} messages={messages} onSend={sendMessage} />
      </div>
    </div>
  );
};

export default AppScreen;
