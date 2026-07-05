import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { PORT, METERED_BASE_URL, CORS_CONFIG } from "./constants.js";
import { initSocket } from "./socket/index.js";

const app = express();
app.use(cors(CORS_CONFIG));

const server = http.createServer(app);
const io = new Server(server, { cors: CORS_CONFIG });

initSocket(io);

app.get("/", (req, res) => {
  res.send("Home Route");
});

app.get("/api/turn-credentials", async (req, res) => {
  try {
    // fetch static ICE servers from Metered
    const iceResponse = await fetch(
      `${METERED_BASE_URL}${process.env.METERED_API_KEY}`,
    );
    const iceServers = await iceResponse.json();
    res.json(iceServers);
  } catch (err) {
    console.error("Failed to fetch TURN credentials:", err);
    res.status(500).json({ error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`Server listening on PORT: ${PORT}`);
});
