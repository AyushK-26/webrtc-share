import { useState, useLayoutEffect } from "react";
import Landing from "./components/Landing";
import AppScreen from "./components/AppScreen";

const App = () => {
  const [roomId, setRoomId] = useState("");

  // Strict Mode remounts once in dev; clear any horizontal scroll
  // a brief layout overflow may have left behind.
  useLayoutEffect(() => {
    document.documentElement.scrollLeft = 0;
    document.body.scrollLeft = 0;
  }, []);

  const handleJoin = (id) => {
    setRoomId(id);
  };

  if (!roomId) return <Landing onJoin={handleJoin} />;

  return <AppScreen roomId={roomId} onLeave={() => setRoomId(null)} />;
};

export default App;
