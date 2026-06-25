import { useRef, useState } from "react";
import { socket } from "../socket";
import { ICE_SERVERS } from "../constants";

export const useWebRTC = (onDataChannel) => {
  const [status, setStatus] = useState("idle");
  const pcRef = useRef(null);
  const iceCandidateQueue = useRef([]);

  const drainIceCandidateQueue = async (pc) => {
    for (const candidate of iceCandidateQueue.current) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
    iceCandidateQueue.current = [];
  };

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", { candidate: e.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`connection state: ${pc.connectionState}`);
      setStatus(pc.connectionState);
    };

    // guest side: receive data channel opened by host
    pc.ondatachannel = (e) => onDataChannel(e.channel);

    return pc;
  };

  const joinRoom = async (roomId) => {
    if (!roomId) return;

    socket.off("peer-joined");
    socket.off("offer");
    socket.off("answer");
    socket.off("ice-candidate");

    socket.emit("join-room", roomId, ({ role, error }) => {
      if (error) {
        console.error(error);
        return;
      }

      console.log("Joined as: ", role);

      const pc = createPeerConnection();
      pcRef.current = pc;

      if (role === "host") setStatus("Waiting for peer...");
      if (role === "guest") setStatus("Waiting for offer...");
    });
  };

  // host: fires when guest arrives
  socket.on("peer-joined", async () => {
    console.log("Peer joined, creating offer...");
    const pc = pcRef.current;

    // create data channel and pass it up via callback
    const dc = pc.createDataChannel("chat");
    onDataChannel(dc);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("offer", { offer });
  });

  // guest: receives offer, creates answer
  socket.on("offer", async ({ offer }) => {
    console.log("Received offer");

    const pc = pcRef.current;
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    await drainIceCandidateQueue(pc);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit("answer", { answer });
  });

  // host: receives answer
  socket.on("answer", async ({ answer }) => {
    console.log("Received offer");

    const pc = pcRef.current;
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
    await drainIceCandidateQueue(pc);
  });

  // both sides: receive ICE candidates
  socket.on("ice-candidate", async ({ candidate }) => {
    const pc = pcRef.current;
    if (!pc.remoteDescription) {
      iceCandidateQueue.current.push(candidate);
      return;
    }
    try {
      pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.error("Error adding ICE candidate: ", e);
    }
  });

  return { status, joinRoom };
};
