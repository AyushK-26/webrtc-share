import { useRef, useState, useEffect } from "react";
import { socket } from "../socket";
import { ICE_SERVERS, SIGNALING_URL } from "../constants";

export const useWebRTC = (onDataChannel, onPeerLeft) => {
  const [status, setStatus] = useState("idle");
  const pcRef = useRef(null);
  const iceCandidateQueue = useRef([]);

  const drainIceCandidateQueue = async (pc) => {
    for (const candidate of iceCandidateQueue.current) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
    iceCandidateQueue.current = [];
  };

  const createPeerConnection = (iceServers) => {
    const pc = new RTCPeerConnection({ iceServers });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        console.log("ICE candidate:", e.candidate.type, e.candidate.candidate);
        socket.emit("ice-candidate", { candidate: e.candidate });
      }
    };

    // TODO: Remove
    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState);
    };

    pc.onicegatheringstatechange = () => {
      console.log("ICE gathering state:", pc.iceGatheringState);
    };

    pc.onconnectionstatechange = () => {
      console.log(`connection state: ${pc.connectionState}`);
      setStatus(pc.connectionState);
    };

    // guest side: receive data channel opened by host
    pc.ondatachannel = (e) => onDataChannel(e.channel);

    return pc;
  };

  // register signaling listeners once on mount, clean up on unmount
  useEffect(() => {
    // host: fires when guest arrives
    const handlePeerJoined = async () => {
      console.log("Peer joined, creating offer...");
      const pc = pcRef.current;

      // only create offer if connection is in a clean state
      // guards against duplicate peer-joined events
      if (!pc || pc.signalingState !== "stable") return;

      // host creates the data channel, guest receives it via ondatachannel
      const dc = pc.createDataChannel("chat");
      onDataChannel(dc);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", { offer });
    };

    // guest: receives offer, creates answer
    const handleOffer = async ({ offer }) => {
      console.log("Received offer");
      const pc = pcRef.current;

      // only accept offer if we're in stable state (not already mid-negotiation)
      // drops duplicate offers that arrive
      if (!pc || pc.signalingState !== "stable") return;

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      await drainIceCandidateQueue(pc);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { answer });
    };

    // host: receives answer
    const handleAnswer = async ({ answer }) => {
      console.log("Received answer");
      const pc = pcRef.current;

      // only accept answer if we're waiting for one (have-local-offer)
      // drops duplicate answers that arrive
      if (!pc || pc.signalingState !== "have-local-offer") return;

      await pc.setRemoteDescription(new RTCSessionDescription(answer));

      await drainIceCandidateQueue(pc);
    };

    // both sides: receive ICE candidates
    const handleIceCandidate = async ({ candidate }) => {
      const pc = pcRef.current;

      if (!pc) return;
      if (!pc.remoteDescription) {
        iceCandidateQueue.current.push(candidate);
        return;
      }
      try {
        pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error("Error adding ICE candidate: ", e);
      }
    };

    const handlePeerLeft = () => {
      console.log("Peer left");
      onPeerLeft();
      setStatus("idle");
    };

    socket.on("peer-joined", handlePeerJoined);
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("peer-left", handlePeerLeft);

    return () => {
      socket.off("peer-joined", handlePeerJoined);
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("peer-left", handlePeerLeft);
    };
  }, []);

  const fetchTurnCredentials = async () => {
    try {
      const res = await fetch(`${SIGNALING_URL}/api/turn-credentials`, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

      return await res.json();
    } catch (err) {
      console.error(
        "Failed to fetch TURN credentials, falling back to Google STUN:",
        err,
      );
      // fallback so peer connection can still be created
      return ICE_SERVERS;
    }
  };

  const joinRoom = async (roomId) => {
    if (!roomId) return;

    const iceServers = await fetchTurnCredentials();

    if (!Array.isArray(iceServers) || iceServers.length === 0) {
      console.error("Invalid ICE servers, aborting");
      return;
    }

    socket.emit("join-room", roomId, ({ role, error }) => {
      if (error) {
        console.error(error);
        return;
      }

      console.log("Joined as: ", role);

      // only create peer if join succeeded
      const pc = createPeerConnection(iceServers);
      pcRef.current = pc;

      if (role === "host") setStatus("Waiting for peer...");
      if (role === "guest") setStatus("Waiting for offer...");
    });
  };

  const leaveRoom = () => {
    socket.emit("leave-room");
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    setStatus("idle");
  };

  return { status, joinRoom, leaveRoom };
};
