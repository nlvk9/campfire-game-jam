const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- CONFIGURATION ---
const gravity = 0.5;
const groundHeight = 300;
const oceanDepth = 5000;
let keys = {};
let cameraY = 0;
let gameState = "title"; // title, playing, glitching
let worldMode = "surface";
let pressure = 0;
let score = 0;

const player = {
  x: 100,
  y: 0,
  width: 20,
  height: 38,
  walkSpeed: 4,
  swimSpeed: 2.5,
  vy: 0,
  onGround: false,
  inSub: false,
};

const sub = {
  x: 300,
  y: 0,
  width: 130,
  height: 80,
  speed: 5,
  playerInside: false,
  lightOn: false,
  battery: 100,
  drainRate: 0.1,
};

// Fragments: Surface (Cyan) vs Beneath (Magenta)
const fragments = [
  { x: 800, y: 600, type: "surface", collected: false },
  { x: 1500, y: 1200, type: "beneath", collected: false },
  { x: 400, y: 2000, type: "beneath", collected: false },
  { x: 1200, y: 3500, type: "surface", collected: false },
  { x: 800, y: 4800, type: "beneath", collected: false },
];

player.y = canvas.height - groundHeight - player.height;
sub.y = canvas.height - groundHeight - 40;

// --- INPUTS ---
window.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (gameState === "title" && e.key === "Enter") gameState = "playing";
  if (gameState === "playing") {
    if (e.key === "Shift")
      worldMode = worldMode === "surface" ? "beneath" : "surface";
    if (e.key.toLowerCase() === "l") sub.lightOn = !sub.lightOn;
    if (e.key === " ") handleInteraction();
  }
});
window.addEventListener("keyup", (e) => (keys[e.key] = false));

function handleInteraction() {
  const distToSub = Math.hypot(
    player.x - sub.x,
    player.y + player.height / 2 - (sub.y + sub.height / 2),
  );
  if (!sub.playerInside && distToSub < 100) {
    sub.playerInside = true;
    player.inSub = true;
  } else if (sub.playerInside) {
    sub.playerInside = false;
    player.inSub = false;
    player.y = sub.y; // Pop out at sub level
  }
}

// --- GAME LOOP ---
function update() {
  if (gameState === "playing") {
    const oceanTop = canvas.height - groundHeight;

    // Pressure & Reality Logic
    if (worldMode === "beneath") {
      pressure += 0.25;
      if (pressure >= 100) {
        pressure = 100;
        worldMode = "surface";
      }
    } else {
      pressure = Math.max(0, pressure - 0.4);
    }

    if (!sub.playerInside) {
      const isSwimming = player.x > 500 || player.y > oceanTop;
      const speed = isSwimming ? player.swimSpeed : player.walkSpeed;

      if (keys["ArrowLeft"]) player.x -= speed;
      if (keys["ArrowRight"]) player.x += speed;

      if (isSwimming) {
        if (keys["ArrowUp"]) player.y -= speed;
        if (keys["ArrowDown"]) player.y += speed;
        player.vy = 0;
      } else {
        if (keys["ArrowUp"] && player.onGround) {
          player.vy = -12;
          player.onGround = false;
        }
        player.vy += gravity;
        player.y += player.vy;
        if (player.y > oceanTop - player.height) {
          player.y = oceanTop - player.height;
          player.vy = 0;
          player.onGround = true;
        }
      }
    } else {
      if (keys["ArrowLeft"]) sub.x -= sub.speed;
      if (keys["ArrowRight"]) sub.x += sub.speed;
      if (keys["ArrowUp"]) sub.y -= sub.speed;
      if (keys["ArrowDown"]) sub.y += sub.speed;
      sub.y = Math.max(
        oceanTop - 100,
        Math.min(sub.y, oceanDepth - sub.height),
      );
      player.x = sub.x + 50;
      player.y = sub.y + 20;

      if (sub.lightOn) {
        sub.battery -= sub.drainRate;
        if (sub.battery <= 0) {
          sub.battery = 0;
          sub.lightOn = false;
        }
      }
    }

    // Camera follow
    let targetY = (sub.playerInside ? sub.y : player.y) - canvas.height / 2;
    cameraY += (targetY - cameraY) * 0.1;

    // Fragments
    fragments.forEach((f) => {
      if (!f.collected && f.type === worldMode) {
        if (Math.hypot(player.x - f.x, player.y - f.y) < 60) {
          f.collected = true;
          score += f.type === "beneath" ? 50 : 20;
        }
      }
    });
  }
  draw();
  requestAnimationFrame(update);
}

// --- RENDER ---
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameState === "title") {
    drawTitleScreen();
    return;
  }

  ctx.save();
  // Screen shake in Beneath mode
  if (worldMode === "beneath") {
    ctx.translate(
      (Math.random() - 0.5) * (pressure / 10),
      (Math.random() - 0.5) * (pressure / 10),
    );
  }

  const oceanTop = canvas.height - groundHeight;

  // Background
  ctx.fillStyle = worldMode === "surface" ? "#0a0a12" : "#120012";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(0, -cameraY);

  // Ocean Gradient
  const oceanGrd = ctx.createLinearGradient(0, oceanTop, 0, oceanDepth);
  if (worldMode === "surface") {
    oceanGrd.addColorStop(0, "#1e3c72");
    oceanGrd.addColorStop(1, "#000428");
  } else {
    oceanGrd.addColorStop(0, "#4b0082");
    oceanGrd.addColorStop(1, "#000000");
  }
  ctx.fillStyle = oceanGrd;
  ctx.fillRect(0, oceanTop, canvas.width, oceanDepth);

  // Land
  ctx.fillStyle = worldMode === "surface" ? "#1b4332" : "#2d004d";
  ctx.fillRect(0, oceanTop, 500, groundHeight);

  // Fragments
  fragments.forEach((f) => {
    if (!f.collected && f.type === worldMode) {
      ctx.fillStyle = f.type === "surface" ? "#00f2ff" : "#ff00ff";
      ctx.shadowBlur = 15;
      ctx.shadowColor = ctx.fillStyle;
      ctx.beginPath();
      ctx.arc(f.x, f.y, 8 + Math.sin(Date.now() / 200) * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  });

  drawSub();
  if (!sub.playerInside) drawPlayer();

  ctx.restore();

  // Darkness / Lighting
  if (worldMode === "surface") {
    let depthFactor = Math.min(
      0.98,
      (cameraY + canvas.height / 2 - oceanTop) / 3000,
    );
    if (depthFactor > 0) {
      ctx.save();
      if (sub.lightOn && sub.battery > 0) {
        ctx.fillStyle = `rgba(0,0,0,${depthFactor})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = "destination-out";
        const grad = ctx.createRadialGradient(
          sub.x + sub.width - cameraY * 0,
          sub.y + sub.height / 2 - cameraY,
          50,
          sub.x + sub.width,
          sub.y + sub.height / 2 - cameraY,
          400,
        );
        grad.addColorStop(0, "white");
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(
          sub.x + sub.width,
          sub.height / 2 + sub.y - cameraY,
          400,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      } else {
        ctx.fillStyle = `rgba(0,0,0,${depthFactor})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.restore();
    }
  }

  drawUI();
  ctx.restore();
}

function drawTitleScreen() {
  ctx.fillStyle = "#050510";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = "center";
  ctx.fillStyle = "#00f2ff";
  ctx.font = "bold 60px 'Courier New'";
  ctx.fillText("BENEATH THE SURFACE", canvas.width / 2, canvas.height / 2 - 40);
  ctx.font = "20px 'Courier New'";
  ctx.fillStyle = "white";
  ctx.fillText(
    "Reality is layered. The deep holds the truth.",
    canvas.width / 2,
    canvas.height / 2 + 10,
  );
  ctx.fillStyle = Math.floor(Date.now() / 500) % 2 ? "#ff00ff" : "white";
  ctx.fillText(
    "PRESS [ENTER] TO DESCEND",
    canvas.width / 2,
    canvas.height / 2 + 80,
  );
}

function drawPlayer() {
  ctx.fillStyle = worldMode === "surface" ? "#FF4500" : "#00FFCC";
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawSub() {
  ctx.fillStyle = worldMode === "surface" ? "#FFD700" : "#444";
  ctx.beginPath();
  ctx.ellipse(
    sub.x + sub.width / 2,
    sub.y + sub.height / 2,
    sub.width / 2,
    sub.height / 2,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  if (sub.lightOn) {
    ctx.fillStyle = "#FFFFA0";
    ctx.beginPath();
    ctx.arc(sub.x + sub.width, sub.y + sub.height / 2, 10, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawUI() {
  ctx.textAlign = "left";
  ctx.fillStyle = "white";
  ctx.font = "16px monospace";
  ctx.fillText(`FRAGMENTS: ${score}`, 25, 40);
  ctx.fillText(`BATTERY: ${Math.floor(sub.battery)}%`, 25, 65);

  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.fillRect(25, 100, 200, 10);
  ctx.fillStyle = pressure > 80 ? "#ff0000" : "#ff00ff";
  ctx.fillRect(25, 100, pressure * 2, 10);
  ctx.font = "10px monospace";
  ctx.fillText("REALITY PRESSURE", 25, 95);

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText(
    "[ARROWS] MOVE | [SPACE] ENTER SUB | [L] LIGHTS | [SHIFT] TOGGLE REALITY",
    25,
    canvas.height - 20,
  );
}

update();
