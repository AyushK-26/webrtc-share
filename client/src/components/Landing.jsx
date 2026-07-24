import { useState } from "react";

const Landing = ({ onJoin }) => {
  const [roomId, setRoomId] = useState("");

  const generateRoomId = () => {
    const id = Math.random().toString(36).substring(2, 8);
    setRoomId(id);
  };

  const handleJoin = () => {
    if (!roomId.trim()) return;
    onJoin(roomId.trim());
  };

  return (
    <div className="flex flex-col md:flex-row min-h-dvh md:h-dvh w-full max-w-full bg-surface overflow-x-hidden overflow-y-auto md:overflow-hidden">
      {/* Branding */}
      <div className="relative flex flex-col justify-center md:flex-1 md:min-h-0 shrink-0 px-8 py-10 md:px-16 md:py-12 border-b md:border-b-0 md:border-r border-border overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -left-10 w-72 h-72 rounded-full bg-brand/10 blur-3xl" />
          <div className="absolute bottom-10 -right-10 w-56 h-56 rounded-full bg-brand/8 blur-3xl" />
          <div className="absolute bottom-32 left-16 w-40 h-40 rounded-full bg-violet-500/8 blur-3xl" />
        </div>

        {/* Logo */}
        <div className="relative z-10 w-10 h-10 bg-brand rounded-xl flex items-center justify-center mb-8">
          <svg
            className="w-5 h-5 stroke-white fill-none"
            strokeWidth={2}
            strokeLinecap="round"
            viewBox="0 0 24 24"
          >
            <path d="M12 3L3 8v8l9 5 9-5V8z" />
            <path d="M3 8l9 5 9-5" />
            <path d="M12 13v8" />
          </svg>
        </div>

        <h1 className="relative z-10 text-2xl md:text-3xl font-semibold text-white tracking-tight mb-3">
          WebRTC Share
        </h1>
        <p className="relative z-10 text-sm text-white/40 leading-relaxed max-w-xs">
          Peer-to-peer file sharing and chat. No servers, no storage, no trace.
        </p>

        <ul className="relative z-10 mt-8 md:mt-10 flex flex-col gap-3 md:gap-4">
          {[
            "End-to-end encrypted via WebRTC",
            "Files never touch a server",
            "Chat disappears when you leave",
            "Works across networks via TURN",
          ].map((element) => (
            <li
              key={element}
              className="flex items-center gap-3 text-sm text-white/50"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
              {element}
            </li>
          ))}
        </ul>
      </div>

      {/* Join Card */}
      <div className="flex md:flex-1 md:min-h-0 shrink-0 items-center justify-center px-6 py-8 md:px-12 md:py-10">
        <div className="w-full max-w-sm bg-surface-overlay border border-border rounded-2xl p-6 md:p-8">
          <h2 className="text-base font-medium text-white mb-1">Join a room</h2>
          <p className="text-sm text-white/40 mb-6">
            Enter a room ID to connect with someone.
          </p>

          <label className="block text-xs text-white/40 mb-1.5">Room ID</label>
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            placeholder="e.g. six-seven-67"
            className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-brand transition-colors"
          />

          <button
            onClick={handleJoin}
            className="w-full mt-4 bg-brand hover:bg-brand-hover transition-colors rounded-lg py-2.5 text-sm font-medium text-white cursor-pointer"
          >
            Join Room
          </button>

          <div className="my-5 border-t border-border" />
          <p className="text-center text-xs text-white/20 mb-4">
            or create a new room
          </p>

          <button
            onClick={generateRoomId}
            className="w-full bg-transparent border border-border hover:border-brand/50 text-white/40 hover:text-white transition-colors rounded-lg py-2.5 text-sm cursor-pointer"
          >
            Generate room ID
          </button>
        </div>
      </div>
    </div>
  );
};

export default Landing;
