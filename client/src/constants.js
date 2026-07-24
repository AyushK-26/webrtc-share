// export const SIGNALING_URL = "http://localhost:3000";
export const SIGNALING_URL = "https://patriarch-dullness-siesta.ngrok-free.dev";

// Google STUN and self hosted coturn server.
// Using metered.ca STUN and TURN servers.
// Google STUN Server as fallback.

export const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  // Self hosted coturn server temporarily disabled.
  //   {
  //     urls: import.meta.env.VITE_TURN_URL,
  //     username: import.meta.env.VITE_TURN_USERNAME,
  //     credential: import.meta.env.VITE_TURN_CREDENTIAL,
  //   },
];

export const CHUNK_SIZE = 16 * 1024;
export const BUFFER_THRESHOLD = 256 * 1024;
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
