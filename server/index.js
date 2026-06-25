import express from "express";
import http from "http";
import { Server } from "socket.io";
import { PORT, CORS_CONFIG } from "./constants.js";
import { initSocket } from "./socket/index.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: CORS_CONFIG });

initSocket(io);

app.get("/", (req, res) => {
  res.send("Home Route");
});

server.listen(PORT, () => {
  console.log(`Server listening on PORT: ${PORT}`);
});
