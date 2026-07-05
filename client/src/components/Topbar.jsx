const statusConfig = {
  connected: {
    label: "Connected",
    className: "bg-green-950 text-green-400 border border-green-900",
  },
  connecting: {
    label: "Connecting...",
    className: "bg-yellow-950 text-yellow-400 border border-yellow-900",
  },
  disconnected: {
    label: "Disconnected",
    className: "bg-red-950 text-red-400 border border-red-900",
  },
};

const TopBar = ({ status, roomId, onLeave }) => {
  const pill = statusConfig[status] ?? {
    label: status,
    className: "bg-surface-muted text-white/40 border border-border",
  };

  return (
    <div className="flex items-center justify-between h-12 px-3 md:px-5 bg-surface-raised border-b border-border shrink-0">
      <div className="flex items-center gap-2 md:gap-3">
        <div className="w-6 h-6 bg-brand rounded-md flex items-center justify-center shrink-0">
          <svg
            className="w-3.5 h-3.5 stroke-white fill-none"
            strokeWidth={2.2}
            strokeLinecap="round"
            viewBox="0 0 24 24"
          >
            <path d="M12 3L3 8v8l9 5 9-5V8z" />
            <path d="M3 8l9 5 9-5" />
            <path d="M12 13v8" />
          </svg>
        </div>
        <span className="text-sm font-medium text-white">WebRTC Share</span>
        <span
          className={`hidden sm:inline text-xs px-2.5 py-0.5 rounded-full font-medium ${pill.className}`}
        >
          {pill.label}
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs text-white/30">
        {/* status pill moves here on mobile */}
        <span
          className={`sm:hidden text-xs px-2 py-0.5 rounded-full font-medium ${pill.className}`}
        >
          {pill.label}
        </span>
        <span className="hidden sm:inline font-mono text-white/50">
          {roomId}
        </span>
        <button
          onClick={onLeave}
          className="ml-1 md:ml-2 border border-border hover:border-brand/50 rounded-md px-2.5 py-1 text-white/40 hover:text-white transition-colors cursor-pointer"
        >
          Leave
        </button>
      </div>
    </div>
  );
};

export default TopBar;
