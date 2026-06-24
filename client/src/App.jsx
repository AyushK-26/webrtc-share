import { io } from "socket.io-client";
import { useState, useRef, useEffect } from "react";

const SIGNALING_URL = "http://localhost:3000";
const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

const socket = io(SIGNALING_URL);

const App = () => {
  const [roomId, setRoomId] = useState("");
  const [status, setStatus] = useState("idle");
  const roleRef = useRef(null);
  const pcRef = useRef(null);
  const iceCandidateQueue = useRef([]);

  useEffect(() => {
    socket.on("connect", () => console.log("socket connected: ", socket.id));
    // no disconnect here since socket is outside component
  }, []);

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", { candidate: e.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("connection state: ", pc.connectionState);
      setStatus(pc.connectionState);
    };

    // moved here from inside the offer handler
    pc.ondatachannel = (e) => {
      e.channel.onopen = () => {
        console.log("DataChannel open - connected!");
        setStatus("connected");
      };
    };

    return pc;
  };

  const joinRoom = async () => {
    if (!roomId) return;

    // prevent listener stacking if Join is clicked more than once
    socket.off("peer-joined");
    socket.off("offer");
    socket.off("answer");
    socket.off("ice-candidate");

    socket.emit("join-room", roomId, async ({ role, error }) => {
      if (error) {
        console.error(error);
        return;
      }

      console.log("Joined as: ", role);
      roleRef.current = role;

      const pc = createPeerConnection();
      pcRef.current = pc;

      if (role === "host") {
        setStatus("waiting for peer...");
      }
      if (role === "guest") {
        setStatus("waiting for offer...");
      }
    });

    // host: fires when guest arrives
    socket.on("peer-joined", async () => {
      console.log("peer joined, creating offer...");
      const pc = pcRef.current;

      const dc = pc.createDataChannel("chat");
      dc.onopen = () => {
        console.log("DataChannel open - connected!");
        setStatus("connected");
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", { offer });
    });

    // guest: receives offer, creates answer
    socket.on("offer", async ({ offer }) => {
      console.log("received offer");
      const pc = pcRef.current;
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // drain queued ICE candidates now that remote description is set
      for (const candidate of iceCandidateQueue.current) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      iceCandidateQueue.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { answer });
    });

    // host: receives answer from guest
    socket.on("answer", async ({ answer }) => {
      console.log("received answer");
      const pc = pcRef.current;
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    // both sides: receive ICE candidates
    socket.on("ice-candidate", async ({ candidate }) => {
      const pc = pcRef.current;
      if (!pc.remoteDescription) {
        // queue it if remote description isn't set yet
        iceCandidateQueue.current.push(candidate);
        return;
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error("error adding ICE candidate: ", e);
      }
    });
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
      <button onClick={joinRoom}>Join Room</button>
      <p>Status: {status}</p>
    </>
  );
};

export default App;
