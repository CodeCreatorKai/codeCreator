const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 400;
canvas.height = 600;

// Stickman avatar
let stickman = {
  x: canvas.width / 2,
  y: canvas.height - 60,
  size: 20
};

let obstacles = [];
let level = 1;
let score = 0;
let maxLevels = 10;

// Difficulty settings
let obstacleSpeed = 1.2;
let spawnChance = 0.01;

// Movement
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") stickman.y -= 50;
  if (e.key === "ArrowDown") stickman.y += 50;
  if (e.key === "ArrowLeft") stickman.x -= 30;
  if (e.key === "ArrowRight") stickman.x += 30;

  // Keep inside canvas
  stickman.x = Math.max(0, Math.min(canvas.width - stickman.size, stickman.x));
  stickman.y = Math.max(0, Math.min(canvas.height - stickman.size, stickman.y));
});

// Spawn obstacles
function spawnObstacle() {
  if (Math.random() < spawnChance) {
    let side = Math.random() < 0.5 ? 0 : canvas.width;
    let y = Math.floor(Math.random() * 10) * 60;
    let dir = side === 0 ? 1 : -1;
    obstacles.push({ x: side, y: y, w: 40, h: 20, dir: dir });
  }
}

// Update obstacles
function updateObstacles() {
  obstacles.forEach((obs, i) => {
    obs.x += obs.dir * obstacleSpeed;
    if (obs.x < -obs.w || obs.x > canvas.width + obs.w) {
      obstacles.splice(i, 1);
    }
  });
}

// Collision check
function checkCollision() {
  for (let obs of obstacles) {
    if (
      stickman.x < obs.x + obs.w &&
      stickman.x + stickman.size > obs.x &&
      stickman.y < obs.y + obs.h &&
      stickman.y + stickman.size > obs.y
    ) {
      alert("Game Over! You reached level " + level);
      resetGame();
    }
  }
}

// Draw stickman
function drawStickman() {
  ctx.strokeStyle = "white";
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

// Draw everything
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw obstacles
  ctx.fillStyle = "red";
  obstacles.forEach((obs) => ctx.fillRect(obs.x, obs.y, obs.w, obs.h));

  // Draw stickman
  drawStickman();

  // Score & Level
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Level: " + level, 10, 30);
  ctx.fillText("Score: " + score, 10, 60);
}

// Level complete check
function checkLevelComplete() {
  if (stickman.y <= 0) {
    score += 100;
    level++;
    if (level > maxLevels) {
      alert("🎉 You won the game! Final Score: " + score);
      resetGame();
    } else {
      alert("✅ Level " + (level - 1) + " complete! Moving to Level " + level);
      nextLevel();
    }
  }
}

// Next level (harder)
function nextLevel() {
  stickman.x = canvas.width / 2;
  stickman.y = canvas.height - 60;
  obstacles = [];
  obstacleSpeed += 0.5;      // faster obstacles
  spawnChance += 0.005;      // more obstacles
}

// Reset game
function resetGame() {
  stickman.x = canvas.width / 2;
  stickman.y = canvas.height - 60;
  obstacles = [];
  score = 0;
  level = 1;
  obstacleSpeed = 1.2;
  spawnChance = 0.01;
}

// Game loop
function gameLoop() {
  spawnObstacle();
  updateObstacles();
  checkCollision();
  checkLevelComplete();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
