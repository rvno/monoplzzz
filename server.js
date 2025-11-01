const express = require("express");
const path = require("node:path");
const app = express();
const port = Number(process.env.PORT || 3000);
const server = app.listen(port);

app.use(express.static(path.join(__dirname, "public/")));
// app.use(express.static("public"));

console.log(`Server is listening on port ${port}`);

const socket = require("socket.io");
const io = socket(server);

// Track connected players and board reviews
const players = new Map();
const boardReviews = new Map(); // key: squareId, value: array of reviews

// Utility: generate unique HSL color for each player
function generateUniqueColor() {
  const used = new Set();
  for (const p of players.values()) {
    if (p.color) used.add(p.color);
  }

  for (let i = 0; i < 10; i++) {
    const h = Math.floor(Math.random() * 360);
    const s = 65 + Math.floor(Math.random() * 20);
    const l = 45 + Math.floor(Math.random() * 10);
    const color = `hsl(${h} ${s}% ${l}%)`;
    if (!used.has(color)) return color;
  }
  return `hsl(${Math.floor(Math.random() * 360)} 70% 50%)`;
}

// Generate satirical usernames
function generateSatiricalName() {
  const tiers = [
    "Billionaire",
    "Trust Fund Kid",
    "Silicon Valley Coder",
    "Soup Kitchen Hero",
    "Overworked Intern",
    "Underpaid Artist",
  ];
  const adjective = [
    "Soggy",
    "Greedy",
    "Lonely",
    "Mysterious",
    "Shady",
    "Cheerful",
  ];
  return `${adjective[Math.floor(Math.random() * adjective.length)]} ${
    tiers[Math.floor(Math.random() * tiers.length)]
  }`;
}

// Socket.io events
io.sockets.on("connection", (socket) => {
  console.log("new connection: " + socket.id);

  // Send current players and board reviews snapshot
  const playerSnapshot = {};
  for (const [id, pdata] of players.entries()) playerSnapshot[id] = pdata;

  const reviewSnapshot = {};
  for (const [squareId, reviews] of boardReviews.entries())
    reviewSnapshot[squareId] = reviews;

  socket.emit("currentPlayers", playerSnapshot);
  socket.emit("currentReviews", reviewSnapshot);

  // New player joins
  socket.on("newPlayer", () => {
    const name = generateSatiricalName();
    const color = generateUniqueColor();
    players.set(socket.id, {
      position: 0,
      money: 1500,
      color,
      name,
    });
    io.emit("newPlayer", { playerId: socket.id, color, name });
  });

  // Player moves
  socket.on("playerMove", (data) => {
    const player = players.get(socket.id);
    if (!player) return;

    player.position = data.position;
    io.emit("playerMove", {
      playerId: socket.id,
      position: data.position,
      color: player.color,
      name: player.name,
    });
  });

  // Player adds a review for a square
  socket.on("addReview", ({ squareId, review }) => {
    if (!boardReviews.has(squareId)) boardReviews.set(squareId, []);
    boardReviews.get(squareId).push(review);
    io.emit("updateReviews", { squareId, reviews: boardReviews.get(squareId) });
  });

  socket.on("disconnect", () => {
    players.delete(socket.id);
    io.emit("playerLeft", { playerId: socket.id });
  });
});
