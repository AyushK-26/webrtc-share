import { io } from "socket.io-client";
import { useState, useRef, useEffect } from "react";

const SIGNALING_URL = "http://localhost:3000";
const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];
const CHUNK_SIZE = 16 * 1024;
const BUFFER_THRESHOLD = 256 * 1024;

const socket = io(SIGNALING_URL);

const App = () => {
  const [roomId, setRoomId] = useState("");
  const [status, setStatus] = useState("idle");

  const roleRef = useRef(null);
  const pcRef = useRef(null);
  const iceCandidateQueue = useRef([]);
  const dcRef = useRef(null);
  const fileRef = useRef(null);

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

    pc.ondatachannel = (e) => {
      e.channel.onopen = () => {
        dcRef.current = e.channel;
        console.log("DataChannel open - connected!");
        setStatus("connected");
      };

      e.channel.onmessage = (event) => {
        if (typeof event.data === "string") {
          // metadata
          const meta = JSON.parse(event.data);
          console.log(
            `Receiving file: ${meta.name} File Type: ${meta.fileType} ${meta.totalChunks} chunks`,
          );
        } else {
          // chunk (ArrayBuffer)
          console.log(`Received chunk: ${event.data.byteLength} bytes`);
        }
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
        dcRef.current = dc;
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

      // drain queued ICE candidates now that remote description is set
      for (const candidate of iceCandidateQueue.current) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      iceCandidateQueue.current = [];
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

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    fileRef.current = file;

    console.log(`File name: ${file.name} ${file.size} bytes ${file.type}`);
  };

  const sendFile = () => {
    const file = fileRef.current;
    const dc = dcRef.current;

    if (!file || !dc) return;

    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    console.log(`Sending file: ${file.name} Total Chunks: ${totalChunks}`);

    let chunkIndex = 0;

    const sendNextChunk = () => {
      if (chunkIndex >= totalChunks) {
        console.log("All chunks sent");
        return;
      }

      if (dc.bufferedAmount > BUFFER_THRESHOLD) {
        dc.onbufferedamountlow = () => {
          dc.onbufferedamountlow = null;
          sendNextChunk();
        };
        dc.bufferedAmountLowThreshold = BUFFER_THRESHOLD / 2;
        return;
      }

      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const reader = new FileReader();
      reader.onload = (e) => {
        dc.send(e.target.result);
        console.log(`Sent chunk ${chunkIndex + 1}/${totalChunks}`);
        chunkIndex++;
        sendNextChunk();
      };
      reader.readAsArrayBuffer(chunk);
    };

    dc.send(
      JSON.stringify({
        type: "file-meta",
        name: file.name,
        size: file.size,
        fileType: file.type,
        totalChunks,
      }),
    );

    sendNextChunk();
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

      <input type="file" onChange={handleFileSelect} />
      <button onClick={sendFile} disabled={status !== "connected"}>
        Send File
      </button>
    </>
  );
};

export default App;
