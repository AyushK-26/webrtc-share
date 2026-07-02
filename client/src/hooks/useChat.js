import { useState, useCallback } from "react";

export const useChat = (dcRef) => {
  const [messages, setMessages] = useState([]);

  const onChatMessage = useCallback((text, timestamp) => {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text, timestamp, self: false },
    ]);
  }, []);

  const sendMessage = (text) => {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open" || !text.trim()) return;

    const timestamp = Date.now();
    dc.send(JSON.stringify({ type: "chat", message: text, timestamp }));
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text, timestamp, self: true },
    ]);
  };

  const resetMessages = () => setMessages([]);

  return { messages, sendMessage, onChatMessage, resetMessages };
};
