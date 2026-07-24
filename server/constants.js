export const PORT = process.env.PORT || 3000;

export const METERED_BASE_URL =
  "https://webrtc-share-turn-server.metered.live/api/v1/turn/credentials?apiKey=";

export const CORS_CONFIG = {
  origin: ["https://webrtc-share-client.onrender.com"],
};
