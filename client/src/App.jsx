import { useState } from "react";
import Landing from "./components/Landing";
import AppScreen from "./components/AppScreen";

const App = () => {
  const [roomId, setRoomId] = useState("");

  const handleJoin = (id) => {
    setRoomId(id);
  };

  if (!roomId) return <Landing onJoin={handleJoin} />;

  return <AppScreen roomId={roomId} onLeave={() => setRoomId(null)} />;
};

export default App;
