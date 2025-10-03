const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
const keyReady = { ArrowUp: true, ArrowDown: true, ArrowLeft: true, ArrowRight: true };

// Keydown sets the key state
document.addEventListener("keydown", e => {
  if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
});

// Keyup resets the state and ready flag
document.addEventListener("keyup", e => {
  if (keys.hasOwnProperty(e.key)) {
    keys[e.key] = false;
    keyReady[e.key] = true;
  }
});

// Movement logic
function handleMovement() {
  for (let k in keys) {
    if (keys[k] && keyReady[k]) {
      if (k === "ArrowUp") { stickman.y -= 50; score++; if(stickman.y <= 0) advanceLevel(); }
      if (k === "ArrowDown") stickman.y += 50;
      if (k === "ArrowLeft") stickman.x -= 30;
      if (k === "ArrowRight") stickman.x += 30;

      keyReady[k] = false; // Prevent moving again until key is released
    }
  }

  // Keep player inside canvas
  stickman.x = Math.max(0, Math.min(canvas.width - stickman.size, stickman.x));
  stickman.y = Math.max(0, Math.min(canvas.height - stickman.size, stickman.y));
}
