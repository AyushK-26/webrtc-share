import { useRef, useState, useEffect } from "react";
import { CHUNK_SIZE, BUFFER_THRESHOLD } from "../constants";

export const useFileTransfer = () => {
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [downloadName, setDownloadName] = useState("");

  const dcRef = useRef(null);
  const fileRef = useRef(null);
  const filemetaRef = useRef(null);
  const receivedChunkRef = useRef([]);
  const downloadUrlRef = useRef(null);

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
    const file = e.target.files[0];
    if (!file) return;

    fileRef.current = file;
    console.log(`File selected: ${file.name} ${file.size} bytes ${file.type}`);
  };

  const sendFile = () => {
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
      if (chunkIndex >= totalChunks) {
        console.log("All chunks sent");
        return;
      }

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
        dc.send(e.target.result);
        console.log(`Sent chunk ${chunkIndex + 1}/${totalChunks}`);
        chunkIndex++;
        sendNextChunk();
      };
      reader.readAsArrayBuffer(chunk);
    };

    sendNextChunk();
  };

  const setupDataChannel = (channel) => {
    dcRef.current = channel;

    channel.onopen = () => {
      console.log("DataChannel open - connected!");
    };

    channel.onmessage = (event) => {
      // metadata: store it and reset chunk collection
      if (typeof event.data === "string") {
        const meta = JSON.parse(event.data);
        console.log(`Receiving file: ${meta.name} ${meta.totalChunks} chunks`);
        receivedChunkRef.current = [];
        filemetaRef.current = meta;
      } else {
        // chunk: collect it
        receivedChunkRef.current.push(event.data);
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
    downloadUrl,
    downloadName,
  };
};
