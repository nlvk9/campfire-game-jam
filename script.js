const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- CONFIGURATION ---
const gravity = 0.5;
const waterGravity = 0.05; // Less gravity in water
const groundHeight = 300;
const oceanDepth = 5000;
let keys = {};
let cameraY = 0;
let gameState = "playing";

const player = {
  x: 100,
  y: 0,
  width: 20,
  height: 40,
  walkSpeed: 3,
  swimSpeed: 1.5,
  vy: 0,
  onGround: false,
  inSub: false,
  isSwimming: false,
};

const sub = {
  x: 600,
  y: 0,
  width: 120,
  height: 70,
  speed: 4,
  playerInside: false,
  lightOn: false,
  battery: 100,
  fuelConsumption: 0.2,
};

const artifact = {
  x: 1200,
  y: oceanDepth - 150,
  size: 40,
};

const miniGame = {
  nodes: [
    { color: "#FF4444", matched: false, x: 300 },
    { color: "#44FF44", matched: false, x: 500 },
    { color: "#4444FF", matched: false, x: 700 },
  ],
};

player.y = canvas.height - groundHeight - player.height;
sub.y = canvas.height - groundHeight + 50;

// --- INPUTS ---
window.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (e.key.toLowerCase() === "l" && (sub.playerInside || !sub.playerInside)) {
    // Allow toggling light even if outside, if close enough or just as a game rule
    if (sub.battery > 0) sub.lightOn = !sub.lightOn;
  }
  if (e.key === " ") handleInteraction();
});
window.addEventListener("keyup", (e) => (keys[e.key] = false));

function handleInteraction() {
  if (gameState === "playing") {
    const distToSub = Math.hypot(player.x - sub.x, player.y - sub.y);
    const distToArtifact = Math.hypot(
      sub.x - artifact.x,
      sub.y - (artifact.y - 30),
    );

    if (!sub.playerInside && distToSub < 100) {
      sub.playerInside = true;
      player.inSub = true;
    } else if (sub.playerInside) {
      // Exit Submarine
      sub.playerInside = false;
      player.inSub = false;
      player.x = sub.x - 30; // Exit to the left
    }

    if (sub.playerInside && distToArtifact < 150) {
      gameState = "minigame";
      miniGame.nodes.forEach((n) => (n.matched = false));
    }
  }
}

canvas.addEventListener("mousedown", (e) => {
  if (gameState !== "minigame") return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  miniGame.nodes.forEach((n) => {
    if (mx > n.x && mx < n.x + 100 && my > 300 && my < 400) n.matched = true;
  });

  if (miniGame.nodes.every((n) => n.matched)) {
    sub.battery = 100;
    gameState = "playing";
  }
});

// --- RENDER FUNCTIONS ---
function drawPlayer(x, y) {
  ctx.save();
  ctx.translate(x, y - cameraY);

  // Rotate slightly if swimming
  if (player.isSwimming) ctx.rotate(Math.PI / 4);

  ctx.fillStyle = "#FF4500";
  ctx.fillRect(0, 15, 20, 20);
  ctx.beginPath();
  ctx.arc(10, 8, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSub(x, y) {
  ctx.save();
  ctx.translate(x, y - cameraY);
  ctx.fillStyle = "#FFD700";
  ctx.beginPath();
  ctx.ellipse(
    sub.width / 2,
    sub.height / 2,
    sub.width / 2,
    sub.height / 2,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.strokeStyle = "#B8860B";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#444";
  ctx.fillRect(sub.width - 10, sub.height / 2 - 10, 15, 20);

  if (sub.lightOn && sub.battery > 0) {
    ctx.fillStyle = "#FFFFA0";
    ctx.beginPath();
    ctx.arc(sub.width, sub.height / 2, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = sub.playerInside ? "#00FFFF" : "#111";
  ctx.beginPath();
  ctx.arc(sub.width * 0.5, sub.height / 2, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function update() {
  if (gameState === "playing") {
    const oceanTop = canvas.height - groundHeight;

    if (!sub.playerInside) {
      // Check if in water (past the cliff)
      player.isSwimming = player.x > 500 || player.y > oceanTop;
      const currentSpeed = player.isSwimming
        ? player.swimSpeed
        : player.walkSpeed;

      if (keys["ArrowLeft"]) player.x -= currentSpeed;
      if (keys["ArrowRight"]) player.x += currentSpeed;

      if (player.isSwimming) {
        // Swimming Controls
        if (keys["ArrowUp"]) player.y -= currentSpeed;
        if (keys["ArrowDown"]) player.y += currentSpeed;
        player.vy = 0; // Reset gravity momentum when hitting water
      } else {
        // Land Controls (Platforming)
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

      // Prevent swimming out of the ocean bottom
      player.y = Math.min(player.y, oceanDepth - player.height);
    } else {
      // Inside Submarine
      if (keys["ArrowLeft"]) sub.x -= sub.speed;
      if (keys["ArrowRight"]) sub.x += sub.speed;
      if (keys["ArrowUp"]) sub.y -= sub.speed;
      if (keys["ArrowDown"]) sub.y += sub.speed;

      sub.y = Math.max(oceanTop, Math.min(sub.y, oceanDepth - sub.height));

      player.x = sub.x + 40;
      player.y = sub.y + 20;
    }

    // Battery Drain Logic
    if (sub.lightOn) {
      sub.battery -= sub.fuelConsumption;
      if (sub.battery <= 0) {
        sub.battery = 0;
        sub.lightOn = false;
      }
    }

    // Camera Tracking (Follow sub or player)
    let followY = sub.playerInside ? sub.y : player.y;
    if (followY > canvas.height / 2) cameraY = followY - canvas.height / 2;
  }
  draw();
  requestAnimationFrame(update);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const oceanTop = canvas.height - groundHeight;

  // 1. Environment
  ctx.fillStyle = "#87ceeb";
  ctx.fillRect(0, -cameraY, canvas.width, oceanTop);

  const oceanGrd = ctx.createLinearGradient(
    0,
    oceanTop - cameraY,
    0,
    oceanDepth - cameraY,
  );
  oceanGrd.addColorStop(0, "#1E90FF");
  oceanGrd.addColorStop(0.3, "#00008B");
  oceanGrd.addColorStop(1, "#000005");
  ctx.fillStyle = oceanGrd;
  ctx.fillRect(0, oceanTop - cameraY, 10000, oceanDepth);

  ctx.fillStyle = "#228B22";
  ctx.fillRect(0, oceanTop - cameraY, 500, groundHeight);

  ctx.fillStyle = `hsl(${(Date.now() / 5) % 360}, 100%, 60%)`;
  ctx.fillRect(artifact.x, artifact.y - cameraY, artifact.size, artifact.size);

  drawSub(sub.x, sub.y);
  if (!sub.playerInside) drawPlayer(player.x, player.y);

  // 2. Darkness & Flashlight Logic
  const currentY = sub.playerInside ? sub.y : player.y;
  const depthLevel = (currentY - oceanTop) / 2000;

  if (depthLevel > 0.1) {
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(depthLevel, 0.99)})`;

    if (sub.lightOn && sub.battery > 0) {
      ctx.globalCompositeOperation = "destination-out";
      const grad = ctx.createRadialGradient(
        sub.x + sub.width,
        sub.y + sub.height / 2 - cameraY,
        50,
        sub.x + sub.width,
        sub.y + sub.height / 2 - cameraY,
        350,
      );
      grad.addColorStop(0, "rgba(255, 255, 255, 1)");
      grad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(
        sub.x + sub.width,
        sub.height / 2 + sub.y - cameraY,
        350,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.restore();
    } else {
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  }

  // 3. UI
  ctx.fillStyle = "white";
  ctx.font = "18px 'Courier New'";
  ctx.fillText(
    `DEPTH: ${Math.max(0, Math.floor(currentY - oceanTop))}m`,
    20,
    40,
  );
  ctx.fillStyle = sub.battery < 20 ? "red" : "white";
  ctx.fillText(`BATTERY: ${Math.floor(sub.battery)}%`, 20, 65);
  ctx.fillStyle = "white";
  ctx.fillText(
    `CONTROLS: ARROWS to move, SPACE to enter/exit sub, L for lights`,
    20,
    canvas.height - 30,
  );

  if (gameState === "minigame") {
    ctx.fillStyle = "rgba(0,0,0,0.95)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = "center";
    ctx.fillText("MANUAL RECHARGE: CLICK THE NODES", canvas.width / 2, 250);
    miniGame.nodes.forEach((n) => {
      ctx.fillStyle = n.matched ? "#222" : n.color;
      ctx.fillRect(n.x, 300, 100, 100);
    });
    ctx.textAlign = "left";
  }
}

update();
