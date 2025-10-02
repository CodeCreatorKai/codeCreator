const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 400;
canvas.height = 600;

// Ghost avatar
let ghost = {
    x: canvas.width / 2 - 15,
    y: canvas.height - 60,
    width: 30,
    height: 30,
    color: 'rgba(255,255,255,0.7)',
    lane: 5 // lanes numbered 0-9
};

// Lanes
const laneHeight = 50;
const lanes = [];
for (let i = 0; i < 10; i++) {
    lanes.push({
        y: canvas.height - (i+1)*laneHeight,
        speed: Math.random() * 2 + 1,
        obstacles: []
    });
}

let score = 0;

// Handle keyboard input
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowUp':
            ghost.lane = Math.min(ghost.lane + 1, 9);
            ghost.y = canvas.height - (ghost.lane+1)*laneHeight + (laneHeight-ghost.height)/2;
            break;
        case 'ArrowDown':
            ghost.lane = Math.max(ghost.lane - 1, 0);
            ghost.y = canvas.height - (ghost.lane+1)*laneHeight + (laneHeight-ghost.height)/2;
            break;
        case 'ArrowLeft':
            ghost.x = Math.max(0, ghost.x - 30);
            break;
        case 'ArrowRight':
            ghost.x = Math.min(canvas.width - ghost.width, ghost.x + 30);
            break;
    }
});

// Create obstacles per lane
function createObstacle(lane) {
    const width = 50;
    const height = 30;
    let x = Math.random() < 0.5 ? -width : canvas.width;
    let direction = x < 0 ? 1 : -1;
    lane.obstacles.push({x, y: lane.y + (laneHeight-height)/2, width, height, dir: direction});
}

// Update obstacles
function updateObstacles() {
    lanes.forEach(lane => {
        if (Math.random() < 0.02) createObstacle(lane);
        lane.obstacles.forEach((obs, index) => {
            obs.x += obs.dir * lane.speed * 2;
            if (obs.x > canvas.width || obs.x < -obs.width) {
                lane.obstacles.splice(index, 1);
            }
        });
    });
}

// Check collision
function checkCollision() {
    lanes.forEach(lane => {
        lane.obstacles.forEach(obs => {
            if (
                ghost.x < obs.x + obs.width &&
                ghost.x + ghost.width > obs.x &&
                ghost.y < obs.y + obs.height &&
                ghost.y + ghost.height > obs.y
            ) {
                alert('Game Over! Score: ' + score);
                resetGame();
            }
        });
    });
}

// Reset game
function resetGame() {
    ghost.x = canvas.width / 2 - 15;
    ghost.lane = 5;
    ghost.y = canvas.height - (ghost.lane+1)*laneHeight + (laneHeight-ghost.height)/2;
    lanes.forEach(lane => lane.obstacles = []);
    score = 0;
}

// Draw everything
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw lanes (haunted road stripes)
    for (let i = 0; i < lanes.length; i++) {
        ctx.fillStyle = i%2 === 0 ? '#333' : '#444';
        ctx.fillRect(0, lanes[i].y, canvas.width, laneHeight);
    }

    // Draw ghost
    ctx.fillStyle = ghost.color;
    ctx.fillRect(ghost.x, ghost.y, ghost.width, ghost.height);

    // Draw obstacles (ghost cars)
    ctx.fillStyle = 'red';
    lanes.forEach(lane => lane.obstacles.forEach(obs => ctx.fillRect(obs.x, obs.y, obs.width, obs.height)));

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + score, 10, 30);
}

// Main game loop
function gameLoop() {
    updateObstacles();
    checkCollision();
    draw();
    score++;
    requestAnimationFrame(gameLoop);
}

// Start game
ghost.y = canvas.height - (ghost.lane+1)*laneHeight + (laneHeight-ghost.height)/2;
gameLoop();

