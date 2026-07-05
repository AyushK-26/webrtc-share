import { useState, useCallback } from "react";

const generateId = () =>
  Math.random().toString(36).substring(2) + Date.now().toString(36);

export const useChat = (dcRef) => {
  const [messages, setMessages] = useState([]);

  const onChatMessage = useCallback((text, timestamp) => {
    setMessages((prev) => [
      ...prev,
      { id: generateId(), text, timestamp, self: false },
    ]);
  }, []);

  const sendMessage = (text) => {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open" || !text.trim()) return;

    const timestamp = Date.now();
    dc.send(JSON.stringify({ type: "chat", message: text, timestamp }));
    setMessages((prev) => [
      ...prev,
      { id: generateId(), text, timestamp, self: true },
    ]);
  };

  const resetMessages = () => setMessages([]);

  return { messages, sendMessage, onChatMessage, resetMessages };
};
