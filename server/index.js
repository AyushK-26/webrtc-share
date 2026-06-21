const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

io.on("connection", (socket) => console.log("connected: ", socket.id));

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
