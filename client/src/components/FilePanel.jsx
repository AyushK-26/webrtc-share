import { useState, useRef, useEffect } from "react";

const FilePanel = ({
  status,
  progress,
  pausedBy,
  downloadUrl,
  downloadName,
  transferCancelled,
  onFileSelect,
  onSend,
  onPause,
  onResume,
  onCancel,
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSender, setIsSender] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (progress === 100) {
      setIsSender(false);
      setSelectedFile(null);
    }
  }, [progress]);

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsSender(true);
    setSelectedFile({
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(1) + " MB",
    });

    onFileSelect(e);
  };

  const isConnected = status === "connected";
  const isTransferring = progress > 0 && progress < 100;
  const isDone = progress === 100;

  return (
    <div className="flex flex-col w-full md:w-3/5 border-b md:border-b-0 md:border-r border-border shrink-0">
      <div className="flex items-center gap-2 px-4 py-3.5 border-b border-border">
        <svg
          className="w-4 h-4 stroke-brand fill-none"
          strokeWidth={1.8}
          strokeLinecap="round"
          viewBox="0 0 24 24"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <span className="text-sm font-medium text-white/70">File transfer</span>
      </div>

      <div className="flex flex-col gap-4 p-4">
        {/* Drop zone */}
        {!isTransferring && (
          <div
            onClick={() => isConnected && fileInputRef.current?.click()}
            className={`border border-dashed border-border rounded-xl p-6 md:p-8 flex flex-col items-center gap-2 transition-colors ${isConnected ? "cursor-pointer hover:border-brand/50" : "opacity-40 cursor-not-allowed"}`}
          >
            <svg
              className="w-8 h-8 stroke-white/20 fill-none"
              strokeWidth={1.5}
              strokeLinecap="round"
              viewBox="0 0 24 24"
            >
              <polyline points="16 16 12 12 8 16" />
              <line x1="12" y1="12" x2="12" y2="21" />
              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
            </svg>
            <span className="text-sm text-white/30">
              Drop a file or click to browse
            </span>
            <span className="text-xs text-white/20">Any file type</span>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleChange}
            />
          </div>
        )}

        {/* File selected - ready to send */}
        {isSender && selectedFile && !isTransferring && !isDone && (
          <div className="flex items-center gap-3 bg-surface-overlay border border-border rounded-xl p-3">
            <div className="w-9 h-9 bg-surface-muted rounded-lg flex items-center justify-center shrink-0">
              <svg
                className="w-4.5 h-4.5 stroke-brand fill-none"
                strokeWidth={1.8}
                strokeLinecap="round"
                viewBox="0 0 24 24"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/80 truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-white/30 mt-0.5">
                {selectedFile.size}
              </p>
            </div>
            <button
              onClick={onSend}
              className="bg-brand hover:bg-brand-hover transition-colors rounded-lg px-3.5 py-1.5 text-xs font-medium text-white cursor-pointer shrink-0"
            >
              Send
            </button>
          </div>
        )}

        {/* Progress */}
        {isTransferring && (
          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-xs text-white/40">
              <span>
                {pausedBy ? "Paused" : isSender ? "Sending..." : "Receiving..."}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="h-1 bg-surface-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {pausedBy === null && (
                  <button
                    onClick={onPause}
                    className="flex items-center gap-1.5 bg-surface-subtle border border-border hover:border-brand/50 text-white/40 hover:text-white transition-colors rounded-lg px-3 py-1.5 text-xs cursor-pointer"
                  >
                    <svg
                      className="w-3 h-3 stroke-current fill-none"
                      strokeWidth={2}
                      strokeLinecap="round"
                      viewBox="0 0 24 24"
                    >
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                    Pause
                  </button>
                )}
                {pausedBy === "self" && (
                  <button
                    onClick={onResume}
                    className="flex items-center gap-1.5 bg-surface-subtle border border-border hover:border-brand/50 text-white/40 hover:text-white transition-colors rounded-lg px-3 py-1.5 text-xs cursor-pointer"
                  >
                    <svg
                      className="w-3 h-3 stroke-current fill-none"
                      strokeWidth={2}
                      strokeLinecap="round"
                      viewBox="0 0 24 24"
                    >
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    Resume
                  </button>
                )}
                {pausedBy === "peer" && (
                  <span className="text-xs text-white/30">Paused by peer</span>
                )}

                {isSender && (
                  <button
                    onClick={onCancel}
                    className="flex items-center gap-1.5 bg-surface-subtle border border-border hover:border-red-500/50 hover:text-red-400 transition-colors rounded-lg px-3 py-1.5 text-xs text-white/40 cursor-pointer"
                  >
                    <svg
                      className="w-3 h-3 stroke-current fill-none"
                      strokeWidth={2}
                      strokeLinecap="round"
                      viewBox="0 0 24 24"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    Cancel
                  </button>
                )}
              </div>

              {pausedBy === "self" && (
                <span className="text-xs text-white/30">Paused by you</span>
              )}
            </div>
          </div>
        )}

        {transferCancelled && !isTransferring && !isSender && (
          <div className="flex items-center gap-2 bg-red-950/50 border border-red-900/50 rounded-xl px-3 py-2.5">
            <svg
              className="w-3.5 h-3.5 stroke-red-400 fill-none shrink-0"
              strokeWidth={2}
              strokeLinecap="round"
              viewBox="0 0 24 24"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            <span className="text-xs text-red-400">
              Sender cancelled the transfer
            </span>
          </div>
        )}

        {/* Download ready */}
        {!isSender && downloadUrl && (
          <div className="flex items-center gap-3 bg-green-950/50 border border-green-900/50 rounded-xl p-3">
            <div className="w-9 h-9 bg-green-900/30 rounded-lg flex items-center justify-center shrink-0">
              <svg
                className="w-4.5 h-4.5 stroke-green-400 fill-none"
                strokeWidth={1.8}
                strokeLinecap="round"
                viewBox="0 0 24 24"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/80 truncate">{downloadName}</p>
              <p className="text-xs text-green-400 mt-0.5">Ready to download</p>
            </div>

            <a
              href={downloadUrl}
              download={downloadName}
              className="bg-green-500 hover:bg-green-400 transition-colors rounded-lg px-3.5 py-1.5 text-xs font-medium text-black cursor-pointer shrink-0"
            >
              Download
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilePanel;
