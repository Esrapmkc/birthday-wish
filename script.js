/*
  Birthday Wish — Interactive Page
  Flow:
    Start tap -> candles flicker + 5s countdown -> blow out + glitter burst -> envelope appears
    Envelope click -> pop sound + confetti -> card slides out with message

  URL parameters:
    ?to=Esra&from=Ali&msg=Happy%20Birthday!

  GitHub Pages ready.
*/

const qs = new URLSearchParams(location.search);
const elStart = document.getElementById('start');
const startBtn = document.getElementById('startBtn');
const stage = document.getElementById('stage');
const countdownEl = document.getElementById('countdown');
const candlesEl = document.getElementById('candles');
const envelope = document.getElementById('envelope');
const card = document.getElementById('card');
const replay = document.getElementById('replay');
const pop = document.getElementById('pop');

const toEl = document.getElementById('to');
const fromEl = document.getElementById('from');
const msgEl = document.getElementById('msg');

// --- Message binding
const to = (qs.get('to') || '').trim();
const from = (qs.get('from') || '').trim();
const msg = (qs.get('msg') || qs.get('message') || 'Happy Birthday! ✨\nMay your day be full of sparkle, laughter, and sweet surprises.').trim();

toEl.textContent = to ? `To: ${to}` : '';
fromEl.textContent = from ? `From: ${from}` : '';
msgEl.textContent = msg;

// --- Audio unlock helper (mobile browsers)
async function unlockAudio() {
  try {
    pop.currentTime = 0;
    await pop.play();
    pop.pause();
    pop.currentTime = 0;
  } catch {
    // Autoplay might still be blocked; that's OK.
  }
}

function playPop() {
  try {
    pop.currentTime = 0;
    pop.play();
  } catch {}
}

// --- Glitter burst particles (DOM)
function glitterBurst({ x, y, count = 110 }) {
  const container = document.createElement('div');
  container.className = 'glitter-burst';
  container.style.left = `${x}px`;
  container.style.top = `${y}px`;
  document.body.appendChild(container);

  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.className = 'glitter-particle';

    const angle = Math.random() * Math.PI * 2;
    const dist = 120 + Math.random() * 240;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - (40 + Math.random() * 80);
    const rot = (Math.random() * 720 - 360).toFixed(1);
    const dur = (900 + Math.random() * 900).toFixed(0);
    const size = (2 + Math.random() * 4).toFixed(1);

    p.style.setProperty('--dx', `${dx.toFixed(1)}px`);
    p.style.setProperty('--dy', `${dy.toFixed(1)}px`);
    p.style.setProperty('--rot', `${rot}deg`);
    p.style.setProperty('--dur', `${dur}ms`);
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.dataset.metal = Math.random() < 0.5 ? 'gold' : 'silver';

    container.appendChild(p);
  }

  setTimeout(() => container.remove(), 2200);
}

// --- Confetti (canvas)
const confettiCanvas = document.getElementById('confetti');
const cctx = confettiCanvas.getContext('2d');
let confettiRaf = 0;

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  confettiCanvas.width = Math.floor(window.innerWidth * dpr);
  confettiCanvas.height = Math.floor(window.innerHeight * dpr);
  confettiCanvas.style.width = `${window.innerWidth}px`;
  confettiCanvas.style.height = `${window.innerHeight}px`;
  cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function launchConfetti() {
  cancelAnimationFrame(confettiRaf);

  const W = window.innerWidth;
  const H = window.innerHeight;
  const particles = [];
  const COLORS = ['#d9b75a', '#cfd3d7', '#ffffff'];

  const make = (side) => {
    for (let i = 0; i < 120; i++) {
      const speed = 3 + Math.random() * 6;
      const angle = (side === 'left')
        ? (-20 + Math.random() * 50) * (Math.PI / 180)
        : (150 + Math.random() * 50) * (Math.PI / 180);

      particles.push({
        x: side === 'left' ? -10 : W + 10,
        y: H * (0.25 + Math.random() * 0.5),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (2 + Math.random() * 3),
        g: 0.09 + Math.random() * 0.08,
        r: 2 + Math.random() * 4,
        w: 6 + Math.random() * 10,
        h: 3 + Math.random() * 7,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.22,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        life: 160 + (Math.random() * 60) | 0,
      });
    }
  };

  make('left');
  make('right');

  const start = performance.now();
  function tick(now) {
    const t = now - start;
    cctx.clearRect(0, 0, W, H);

    for (const p of particles) {
      p.vy += p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life -= 1;

      cctx.save();
      cctx.translate(p.x, p.y);
      cctx.rotate(p.rot);
      cctx.fillStyle = p.color;
      cctx.globalAlpha = Math.max(0, Math.min(1, p.life / 120));
      cctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      cctx.restore();
    }

    // remove dead
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      if (p.life <= 0 || p.y > H + 40) particles.splice(i, 1);
    }

    if (t < 2600 && particles.length) {
      confettiRaf = requestAnimationFrame(tick);
    } else {
      cctx.clearRect(0, 0, W, H);
    }
  }

  confettiRaf = requestAnimationFrame(tick);
}

// --- Flow controller (CSS-driven classes)
let running = false;
let interval = null;

function reset() {
  running = false;
  if (interval) {
    clearInterval(interval);
    interval = null;
  }

  stage.classList.remove('show-envelope', 'opened', 'show-card', 'blown');
  countdownEl.textContent = '5';
  countdownEl.style.opacity = '1';

  // re-light candles
  [...candlesEl.querySelectorAll('.candle')].forEach(c => c.classList.remove('out'));

  // disable envelope until ready
  envelope.disabled = true;

  // stop confetti
  cancelAnimationFrame(confettiRaf);
  cctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
}

function blowOut() {
  stage.classList.add('blown');
  countdownEl.style.opacity = '0';

  // extinguish flames
  [...candlesEl.querySelectorAll('.candle')].forEach(c => c.classList.add('out'));

  // glitter burst from roughly center of cake
  const cakeWrap = document.querySelector('.cake-wrap');
  const r = cakeWrap.getBoundingClientRect();
  glitterBurst({ x: r.left + r.width / 2, y: r.top + r.height * 0.36, count: 140 });

  // show envelope after a short beat
  setTimeout(() => {
    stage.classList.add('show-envelope');
    envelope.disabled = false;
  }, 750);
}

function startCountdown() {
  if (running) return;
  running = true;

  let remaining = 5;
  countdownEl.textContent = String(remaining);

  interval = setInterval(() => {
    remaining -= 1;
    countdownEl.textContent = String(Math.max(0, remaining));

    if (remaining <= 0) {
      clearInterval(interval);
      interval = null;
      blowOut();
    }
  }, 1000);
}

function openEnvelope() {
  if (!stage.classList.contains('show-envelope')) return;
  if (stage.classList.contains('opened')) return;

  stage.classList.add('opened');
  playPop();
  launchConfetti();

  // glitter shimmer burst at envelope
  const r = envelope.getBoundingClientRect();
  glitterBurst({ x: r.left + r.width / 2, y: r.top + r.height / 2, count: 95 });

  setTimeout(() => {
    stage.classList.add('show-card');
  }, 620);
}

// --- Events
startBtn.addEventListener('click', async () => {
  await unlockAudio();
  elStart.classList.add('hidden');
  reset();
  startCountdown();
});

envelope.addEventListener('click', openEnvelope);

replay.addEventListener('click', () => {
  reset();
  // Show start overlay again so audio works on mobile if needed
  elStart.classList.remove('hidden');
});

// Safety: if user reloads with overlay hidden, keep things consistent
reset();
