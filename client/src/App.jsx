import { io } from "socket.io-client";
import { useEffect } from "react";

const App = () => {
  useEffect(() => {
    const socket = io("http://localhost:3000");
    socket.on("connect", () => console.log("connected:", socket.id));

    return () => {
      socket.disconnect();
    };
  }, []);
  return <div>Signaling test</div>;
};

export default App;
