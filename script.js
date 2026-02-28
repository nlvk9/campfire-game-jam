// Canvas setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game variables
let mode = "surface"; // 'surface' or 'beneath'
let depth = 0;

// Player submarine
const sub = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  width: 50,
  height: 20,
  speed: 5,
};

// Input handling
const keys = {};
window.addEventListener("keydown", (e) => (keys[e.key] = true));
window.addEventListener("keyup", (e) => (keys[e.key] = false));

// Toggle mode with Space
window.addEventListener("keydown", (e) => {
  if (e.key === " ") mode = mode === "surface" ? "beneath" : "surface";
});

// Game loop
function update() {
  // Movement
  if (keys["ArrowUp"]) sub.y -= sub.speed;
  if (keys["ArrowDown"]) sub.y += sub.speed;
  if (keys["ArrowLeft"]) sub.x -= sub.speed;
  if (keys["ArrowRight"]) sub.x += sub.speed;

  // Clamp to canvas
  sub.x = Math.max(0, Math.min(canvas.width - sub.width, sub.x));
  sub.y = Math.max(0, Math.min(canvas.height - sub.height, sub.y));

  draw();
  requestAnimationFrame(update);
}

// Draw function
function draw() {
  // Background
  if (mode === "surface") {
    ctx.fillStyle = "#87ceeb"; // light blue surface
  } else {
    ctx.fillStyle = "#001440"; // dark deep ocean
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Submarine
  ctx.fillStyle = mode === "surface" ? "#FFD700" : "#FF4500";
  ctx.fillRect(sub.x, sub.y, sub.width, sub.height);

  // Depth indicator
  ctx.fillStyle = "#fff";
  ctx.font = "20px Arial";
  ctx.fillText(`Depth: ${depth} meters`, 20, 30);
  ctx.fillText(`Mode: ${mode}`, 20, 60);
}

// Start game
update();
