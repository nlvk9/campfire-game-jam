const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 600;

// Game variables
const gravity = 0.5;
const groundHeight = 100; // height of the ground from bottom
let keys = {};

// Player
const player = {
  x: 100,
  y: canvas.height - groundHeight - 50, // start on ground
  width: 30,
  height: 50,
  speed: 5,
  vy: 0, // vertical velocity
  onGround: false,
};

// Submarine
const sub = {
  x: 600,
  y: canvas.height - groundHeight - 30,
  width: 60,
  height: 30,
  speed: 4,
  inSub: false,
};

// Input
window.addEventListener("keydown", (e) => (keys[e.key] = true));
window.addEventListener("keyup", (e) => (keys[e.key] = false));

// Enter submarine
window.addEventListener("keydown", (e) => {
  if (
    e.key === "Space" &&
    !sub.inSub &&
    player.x + player.width > sub.x &&
    player.x < sub.x + sub.width
  ) {
    sub.inSub = true;
    player.vy = 0;
    player.onGround = false;
    player.x = sub.x + sub.width / 2 - player.width / 2;
    player.y = sub.y - player.height / 2;
  }
});

// Game loop
function update() {
  // Horizontal movement
  if (keys["ArrowLeft"]) player.x -= player.speed;
  if (keys["ArrowRight"]) player.x += player.speed;

  // Jump
  if (keys["ArrowUp"] && player.onGround) {
    player.vy = -10;
    player.onGround = false;
  }

  // Gravity
  player.vy += gravity;
  player.y += player.vy;

  // Ground collision
  const groundY = canvas.height - groundHeight - player.height;
  if (player.y > groundY) {
    player.y = groundY;
    player.vy = 0;
    player.onGround = true;
  }

  draw();
  requestAnimationFrame(update);
}

// Draw everything
function draw() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Sky
  ctx.fillStyle = "#87ceeb";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Ocean (right side)
  ctx.fillStyle = "#1E90FF";
  ctx.fillRect(500, canvas.height - groundHeight, 300, groundHeight);

  // Ground
  ctx.fillStyle = "#228B22";
  ctx.fillRect(0, canvas.height - groundHeight, 500, groundHeight);

  // Submarine (beside ocean)
  ctx.fillStyle = "#FFD700";
  ctx.fillRect(sub.x, sub.y, sub.width, sub.height);

  // Player
  ctx.fillStyle = "#FF4500";
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // Instructions
  ctx.fillStyle = "white";
  ctx.font = "18px Arial";
  ctx.fillText("Arrow keys to move/jump", 20, 30);
  ctx.fillText("Space bar to enter submarine", 20, 50);
}

// Start game
update();
