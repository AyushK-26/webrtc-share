import { useState, useRef, useEffect } from "react";

const ChatPanel = ({ status, messages, onSend }) => {
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const isConnected = status === "connected";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden min-h-64 md:min-h-0">
      <div className="flex items-center gap-2 px-4 py-3.5 border-b border-border">
        <svg
          className="w-4 h-4 stroke-brand fill-none"
          strokeWidth={1.8}
          strokeLinecap="round"
          viewBox="0 0 24 24"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span className="text-sm font-medium text-white/70">Chat</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-white/20">
              {isConnected ? "No messages yet" : "Waiting for peer..."}
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col max-w-[75%] ${msg.self ? "self-end items-end" : "self-start items-start"}`}
          >
            <div
              className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed
            ${
              msg.self
                ? "bg-brand text-white rounded-br-sm"
                : "bg-surface-muted text-white/80 rounded-bl-sm"
            }`}
            >
              {msg.text}
            </div>
            <span className="text-xs text-white/20 mt-1">
              {new Date(msg.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-border">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={
            isConnected ? "Type a message..." : "Waiting for peer..."
          }
          disabled={!isConnected}
          className="flex-1 bg-surface-subtle border border-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-brand transition-colors disabled:opacity-40"
        />
        <button
          onClick={handleSend}
          disabled={!isConnected}
          className="w-9 h-9 bg-brand hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-lg flex items-center justify-center cursor-pointer shrink-0"
        >
          <svg
            className="w-4 h-4 stroke-white fill-none"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;
