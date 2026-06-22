import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const port = 3000;

io.on("connection", (socket) => {
  console.log("connected: ", socket.id);
  socket.on("message", (data) => {
    console.log("data from client: ", data);
    socket.emit("reply", "Reply from server");
  });
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
