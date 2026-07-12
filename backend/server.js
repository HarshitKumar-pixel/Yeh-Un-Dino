const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "https://yeh-un-dino.vercel.app"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});
let waitingUser = null;
const prompts = [
  "Remember rushing home to watch your favourite cartoon?",
  "Remember buying games on CDs?",
  "What was your favourite school tiffin?",
  "Remember waiting for Sunday morning cartoons?",
  "Which ringtone defined your childhood?",
  "Remember collecting Pokémon cards?",
  "Remember writing in slam books?",
  "Which TV advertisement still lives in your head?",
  "Remember going to cyber cafés?",
  "Remember playing outdoor games until sunset?"
];

io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on('joinQueue', () => {
    if (!waitingUser) {
      waitingUser = socket;
    } else {
      const otherUser = waitingUser;
      waitingUser = null;

      const roomId = `room-${Date.now()}`;

const year = Math.floor(Math.random() * (2016 - 1988 + 1)) + 1988;

const prompt =
  prompts[Math.floor(Math.random() * prompts.length)];

const memoryMatch =
  Math.floor(Math.random() * 25) + 75;

otherUser.join(roomId);
socket.join(roomId);

const matchData = {
  roomId,
  year,
  prompt,
  memoryMatch,
};

otherUser.emit("matched", matchData);
socket.emit("matched", matchData);
    }
  });

  socket.on('sendMessage', ({ roomId, message }) => {
  io.to(roomId).emit('receiveMessage', {
    roomId,
    message,
    senderId: socket.id
  });
});
socket.on("newPrompt", ({ roomId }) => {
  const prompt =
    prompts[Math.floor(Math.random() * prompts.length)];

  io.to(roomId).emit("promptUpdated", {
    prompt
  });
});
socket.on("leaveRoom", ({ roomId }) => {
  socket.to(roomId).emit("partnerLeft");
  socket.leave(roomId);
});

  socket.on('disconnect', () => {
    console.log(`User Disconnected: ${socket.id}`);

    if (waitingUser === socket) {
      waitingUser = null;
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});