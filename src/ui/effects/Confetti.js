/** @file Confetti.js — canvas-based confetti particle system */

/**
 * @param {HTMLCanvasElement} canvas
 * @param {number} [count=120]
 */
export function launchConfetti(canvas, count = 120) {
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width,
    y: -20,
    vx: (Math.random() - 0.5) * 6,
    vy: 2 + Math.random() * 4,
    size: 6 + Math.random() * 8,
    color: `hsl(${Math.random() * 360},90%,60%)`,
    angle: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.2,
  }));

  let frame;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of particles) {
      if (p.y > canvas.height + 20) continue;
      alive = true;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // gravity
      p.angle += p.spin;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }
    if (alive) frame = requestAnimationFrame(draw);
  }
  draw();
  return () => cancelAnimationFrame(frame);
}
