// export const SIGNALING_URL = "http://localhost:3000";
export const SIGNALING_URL = "https://patriarch-dullness-siesta.ngrok-free.dev";

export const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  {
    urls: import.meta.env.VITE_TURN_URL,
    username: import.meta.env.VITE_TURN_USERNAME,
    credential: import.meta.env.VITE_TURN_CREDENTIAL,
  },
];
export const CHUNK_SIZE = 16 * 1024;
export const BUFFER_THRESHOLD = 256 * 1024;
