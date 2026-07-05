import { useRef, useState, useEffect } from "react";
import { CHUNK_SIZE, BUFFER_THRESHOLD } from "../constants";

export const useFileTransfer = () => {
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [downloadName, setDownloadName] = useState("");
  const [progress, setProgress] = useState(0);
  const [pausedBy, setPausedBy] = useState(null);
  const [transferCancelled, setTransferCancelled] = useState(false);

  const dcRef = useRef(null);
  const fileRef = useRef(null);
  const filemetaRef = useRef(null);
  const receivedChunkRef = useRef([]);
  const downloadUrlRef = useRef(null);
  const isPausedRef = useRef(false);
  const sendNextChunkRef = useRef(null);
  const isCancelledRef = useRef(false);

  // revoke blob url on unmount to free browser memory
  useEffect(() => {
    return () => {
      if (downloadUrlRef.current) {
        URL.revokeObjectURL(downloadUrlRef.current);
        downloadUrlRef.current = null;
      }
    };
  }, []);

  const updateDownloadUrl = (url) => {
    downloadUrlRef.current = url;
    setDownloadUrl(url);
  };

  const handleFileSelect = (e) => {
    setProgress(0);
    const file = e.target.files[0];
    if (!file) return;

    fileRef.current = file;
    console.log(`File selected: ${file.name} ${file.size} bytes ${file.type}`);
  };

  const sendFile = () => {
    isCancelledRef.current = false;
    isPausedRef.current = false;

    const file = fileRef.current;
    const dc = dcRef.current;

    if (!file || !dc) return;

    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    console.log(`Sending file: ${file.name} Total chunks: ${totalChunks}`);

    // send metadata first so receiver knows what to expect
    dc.send(
      JSON.stringify({
        type: "file-meta",
        name: file.name,
        size: file.size,
        fileType: file.type,
        totalChunks,
      }),
    );

    let chunkIndex = 0;

    const sendNextChunk = () => {
      if (isCancelledRef.current) return;
      if (chunkIndex >= totalChunks) {
        console.log("All chunks sent");
        return;
      }

      if (isPausedRef.current) return;

      // pause if buffer is too full, resume when it drains
      if (dc.bufferedAmount > BUFFER_THRESHOLD) {
        dc.bufferedAmountLowThreshold = BUFFER_THRESHOLD / 2;
        dc.onbufferedamountlow = () => {
          dc.onbufferedamountlow = null;
          sendNextChunk();
        };
        return;
      }

      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const reader = new FileReader();
      reader.onload = (e) => {
        if (isCancelledRef.current) return;
        if (dc.readyState !== "open") return;
        dc.send(e.target.result);
        console.log(`Sent chunk ${chunkIndex + 1}/${totalChunks}`);
        chunkIndex++;
        setProgress(Math.round((chunkIndex / totalChunks) * 100));
        sendNextChunk();
      };
      reader.readAsArrayBuffer(chunk);
    };

    sendNextChunkRef.current = sendNextChunk;
    sendNextChunk();
  };

  // pauseTransfer — paused by self
  const pauseTransfer = () => {
    if (!dcRef.current) return;
    isPausedRef.current = true;
    setPausedBy("self");
    dcRef.current.send(JSON.stringify({ type: "transfer-paused" }));
    console.log("Transfer paused");
  };

  // resumeTransfer - resumed by self (only callable when pausedBy === "self")
  const resumeTransfer = () => {
    if (!dcRef.current) return;
    isPausedRef.current = false;
    setPausedBy(null);
    dcRef.current.send(JSON.stringify({ type: "transfer-resumed" }));
    console.log("Transfer resumed");
    if (sendNextChunkRef.current) sendNextChunkRef.current();
  };

  const resetTransfer = () => {
    isPausedRef.current = false;
    setPausedBy(null);
    sendNextChunkRef.current = null;
    receivedChunkRef.current = [];
    filemetaRef.current = null;
    setProgress(0);
    setDownloadName("");
    if (downloadUrlRef.current) {
      URL.revokeObjectURL(downloadUrlRef.current);
    }
    updateDownloadUrl(null);
    console.log("Transfer reset");
  };

  // internal - no dc.send, just stop the loop
  const pauseInternal = () => {
    isPausedRef.current = true;
    setPausedBy("peer");
  };

  const resumeInternal = () => {
    isPausedRef.current = false;
    setPausedBy(null);
    if (sendNextChunkRef.current) sendNextChunkRef.current();
  };

  const cancelTransfer = () => {
    isCancelledRef.current = true;
    if (dcRef.current && dcRef.current.readyState === "open") {
      dcRef.current.send(JSON.stringify({ type: "transfer-cancelled" }));
    }
    resetTransfer();
  };

  const setupDataChannel = (channel, onChatMessage) => {
    dcRef.current = channel;

    channel.onopen = () => {
      console.log("DataChannel open - connected!");
    };

    channel.onmessage = (event) => {
      if (typeof event.data === "string") {
        const msg = JSON.parse(event.data);

        if (msg.type === "transfer-paused") {
          pauseInternal();
          console.log("Peer paused the transfer");
          return;
        }

        if (msg.type === "transfer-resumed") {
          resumeInternal();
          console.log("Peer resumed the transfer");
          return;
        }

        if (msg.type === "transfer-cancelled") {
          setTransferCancelled(true);
          resetTransfer();
          return;
        }

        if (msg.type === "chat") {
          onChatMessage?.(msg.message, msg.timestamp);
          return;
        }

        // metadata: store it and reset chunk collection
        console.log(`Receiving file: ${msg.name} ${msg.totalChunks} chunks`);
        setTransferCancelled(false);
        receivedChunkRef.current = [];
        filemetaRef.current = msg;
        setProgress(0);
      } else {
        // chunk: collect it
        if (!filemetaRef.current) return;
        receivedChunkRef.current.push(event.data);
        setProgress(
          Math.round(
            (receivedChunkRef.current.length /
              filemetaRef.current.totalChunks) *
              100,
          ),
        );
        console.log(
          `Received chunk: ${receivedChunkRef.current.length}/${filemetaRef.current.totalChunks}`,
        );

        // last chunk: reassemble and offer download
        if (
          receivedChunkRef.current.length === filemetaRef.current.totalChunks
        ) {
          if (downloadUrlRef.current) {
            URL.revokeObjectURL(downloadUrlRef.current);
          }

          const blob = new Blob(receivedChunkRef.current, {
            type: filemetaRef.current.fileType,
          });

          const url = URL.createObjectURL(blob);
          updateDownloadUrl(url);
          setDownloadName(filemetaRef.current.name);
          console.log("Fle ready to download: ", filemetaRef.current.name);
        }
      }
    };
  };

  return {
    setupDataChannel,
    handleFileSelect,
    sendFile,
    pauseTransfer,
    resumeTransfer,
    resetTransfer,
    cancelTransfer,
    downloadUrl,
    downloadName,
    progress,
    pausedBy,
    transferCancelled,
    dcRef,
  };
};
