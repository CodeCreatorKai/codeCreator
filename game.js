const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 400;
canvas.height = 600;

// Stickman player
let stickman = {
  x: canvas.width / 2,
  y: canvas.height - 60,
  size: 20,
  invincible: false,
  invincibleTimer: 0
};

// Game state
let obstacles = [];
let powerUps = [];
let score = 0;
let level = 1;
let maxLevel = 10;
let obstacleSpeed = 1.2;
let spawnChance = 0.02;
let powerUpChance = 0.001;

// Sound elements
const bgMusic = document.getElementById("bgMusic");
const deathSound = document.getElementById("deathSound");
const powerUpSound = document.getElementById("powerUpSound");
const victorySound = document.getElementById("victorySound");

// Play background music
bgMusic.volume = 0.5;
bgMusic.play().catch(() => {
  document.addEventListener("keydown", () => bgMusic.play(), { once: true });
});

// --- Fixed movement system (no super-speed) ---
const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
const keyReady = { ArrowUp: true, ArrowDown: true, ArrowLeft: true, ArrowRight: true };

document.addEventListener("keydown", e => {
  if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
});

document.addEventListener("keyup", e => {
  if (keys.hasOwnProperty(e.key)) {
    keys[e.key] = false;
    keyReady[e.key] = true; // ready to move again next press
  }
});

// --- Movement handler (one step per press) ---
function handleMovement() {
  for (let k in keys) {
    if (keys[k] && keyReady[k]) {
      if (k === "ArrowUp") {
        stickman.y -= 50;
        score++;
        if (stickman.y <= 0) advanceLevel();
      }
      if (k === "ArrowDown") stickman.y += 50;
      if (k === "ArrowLeft") stickman.x -= 30;
      if (k === "ArrowRight") stickman.x += 30;

      keyReady[k] = false; // block until released
    }
  }

  // Keep player inside canvas
  stickman.x = Math.max(0, Math.min(canvas.width - stickman.size, stickman.x));
  stickman.y = Math.max(0, Math.min(canvas.height - stickman.size, stickman.y));
}

// --- Level progression ---
function advanceLevel() {
  if (level < maxLevel) {
    level++;
    stickman.y = canvas.height - 60;
    obstacles = [];
    obstacleSpeed += 0.5;
    spawnChance += 0.005;
    document.body.style.backgroundColor = `rgb(${20+level*10}, 20, ${20+level*5})`;
  } else winGame();
}

// --- Reset game ---
function resetGame() {
  stickman.x = canvas.width / 2;
  stickman.y = canvas.height - 60;
  obstacles = [];
  powerUps = [];
  score = 0;
  level = 1;
  obstacleSpeed = 1.2;
  spawnChance = 0.02;
  powerUpChance = 0.001;
  stickman.invincible = false;
}

// --- Obstacle spawning (bats, pumpkins, carriages) ---
function spawnObstacle() {
  if (Math.random() < spawnChance) {
    let type = Math.random();
    let side = Math.random() < 0.5 ? 0 : canvas.width;
    let y = Math.floor(Math.random() * 10) * 60;
    let dir = side === 0 ? 1 : -1;

    if (type < 0.4) {
      obstacles.push({ x: side, y, w: 20, h: 15, dir, speed: obstacleSpeed * 2, color: "purple" }); // Bat
    } else if (type < 0.8) {
      obstacles.push({ x: side, y, w: 30, h: 30, dir, speed: obstacleSpeed * 1.2, color: "orange" }); // Pumpkin
    } else {
      obstacles.push({ x: side, y, w: 60, h: 25, dir, speed: obstacleSpeed * 0.8, color: "red" }); // Carriage
    }
  }
}

// --- Power-ups (lanterns) ---
function spawnPowerUp() {
  if (Math.random() < powerUpChance) {
    powerUps.push({
      x: Math.random() * (canvas.width - 20),
      y: Math.floor(Math.random() * 10) * 60,
      size: 15
    });
  }
}

// --- Update obstacles ---
function updateObstacles() {
  obstacles.forEach((o, i) => {
    o.x += o.dir * o.speed;
    if (o.x < -o.w || o.x > canvas.width + o.w) obstacles.splice(i, 1);
  });
}

// --- Collision detection ---
function checkCollision() {
  if (!stickman.invincible) {
    for (let obs of obstacles) {
      if (
        stickman.x < obs.x + obs.w &&
        stickman.x + stickman.size > obs.x &&
        stickman.y < obs.y + obs.h &&
        stickman.y + stickman.size > obs.y
      ) {
        deathSound.currentTime = 0;
        deathSound.play();
        alert(`💀 Game Over! Score: ${score} | Level: ${level}`);
        resetGame();
      }
    }
  }

  for (let i = 0; i < powerUps.length; i++) {
    let p = powerUps[i];
    if (
      stickman.x < p.x + p.size &&
      stickman.x + stickman.size > p.x &&
      stickman.y < p.y + p.size &&
      stickman.y + stickman.size > p.y
    ) {
      score += 10;
      stickman.invincible = true;
      stickman.invincibleTimer = 300;
      powerUpSound.currentTime = 0;
      powerUpSound.play();
      powerUps.splice(i, 1);
    }
  }
}

// --- Victory ---
function winGame() {
  bgMusic.pause();
  victorySound.play();
  alert(`🎉 You survived all 10 haunted levels! Final Score: ${score}`);
  resetGame();
}

// --- Draw stickman ---
function drawStickman() {
  ctx.strokeStyle = stickman.invincible ? "cyan" : "white";
  ctx.lineWidth = 2;

  let cx = stickman.x + stickman.size / 2;
  let cy = stickman.y + stickman.size / 2;

  // Head
  ctx.beginPath();
  ctx.arc(cx, cy - 10, 8, 0, Math.PI * 2);
  ctx.stroke();

  // Body
  ctx.beginPath();
  ctx.moveTo(cx, cy - 2);
  ctx.lineTo(cx, cy + 15);
  ctx.stroke();

  // Arms
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy + 2);
  ctx.lineTo(cx + 10, cy + 2);
  ctx.stroke();

  // Legs
  ctx.beginPath();
  ctx.moveTo(cx, cy + 15);
  ctx.lineTo(cx - 8, cy + 30);
  ctx.moveTo(cx, cy + 15);
  ctx.lineTo(cx + 8, cy + 30);
  ctx.stroke();
}

// --- Draw everything ---
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Haunted road stripes
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = i % 2 === 0 ? "#2a2a2a" : "#3a3a3a";
    ctx.fillRect(0, i * 60, canvas.width, 60);
  }

  // Obstacles
  obstacles.forEach(o => {
    ctx.fillStyle = o.color;
    ctx.fillRect(o.x, o.y, o.w, o.h);
  });

  // Power-ups
  powerUps.forEach(p => {
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // Player
  drawStickman();

  // HUD
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 30);
  ctx.fillText("Level: " + level, 300, 30);
}

// --- Game loop ---
function gameLoop() {
  handleMovement();
  spawnObstacle();
  spawnPowerUp();
  updateObstacles();
  checkCollision();

  if (stickman.invincible) {
    stickman.invincibleTimer--;
    if (stickman.invincibleTimer <= 0) stickman.invincible = false;
  }

  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
