"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  orgId: string;
  userId: string | null; // null in guest mode
  isGuest: boolean;
};

type GameState = "ready" | "running" | "gameover";

function randRange(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function aabb(a: { x: number; y: number; w: number; h: number }, b: any) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: boolean,
  stroke: boolean,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function glowLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number,
  blur: number,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.shadowBlur = blur;
  ctx.shadowColor = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

export function LunchboxRunGame({ orgId, userId, isGuest }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const [uiState, setUiState] = useState<GameState>("ready");
  const uiStateRef = useRef<GameState>("ready");

  const spriteRef = useRef<HTMLImageElement | null>(null);
  const [spriteReady, setSpriteReady] = useState(false);

  const [score, setScore] = useState(0);

  const [hi, setHi] = useState(0);

useEffect(() => {
  if (typeof window === "undefined") return;
  const v = window.localStorage.getItem("bg_lunchbox_run_hi");
  const n = v ? Number(v) : 0;
  setHi(Number.isFinite(n) ? n : 0);
}, []);

  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);

  const cfg = useMemo(
    () => ({
      width: 500,
      height: 320,

      groundY: 238,
      gravity: 2900,
      jumpVel: 963,

      baseSpeed: 350, // slow start
      maxSpeed: 1500,

      speedupMinS: 6,
      speedupMaxS: 10,
      speedupMinMult: 1.05,
      speedupMaxMult: 1.3,

      obstacleBaseGap: 325,
      obstacleGapScale: 0.25,

      // fair hitbox
      hitInsetX: 12,
      hitInsetY: 15,
      hitInsetW: 22,
      hitInsetH: 20,
    }),
    [],
  );

  function setState(next: GameState) {
    uiStateRef.current = next;
    setUiState(next);
  }

  // Load Lenny sprite
  useEffect(() => {
    const img = new Image();
    img.src = "/bitgalaxy/sprites/lenny.png";

    img.onload = () => {
      spriteRef.current = img;
      setSpriteReady(true);
    };

    img.onerror = () => {
      console.error("Failed to load Lenny sprite PNG");
      spriteRef.current = null;
      setSpriteReady(false);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctxMaybe = canvas.getContext("2d");
    if (!ctxMaybe) return;
    const ctx: CanvasRenderingContext2D = ctxMaybe;

    const view = { w: cfg.width, h: cfg.height, sx: 1, sy: 1 };

    function isMobileView() {
  // based on actual rendered canvas width
  return view.w < 520; // tweak threshold if you want
}

// base player dimensions (your “desktop design”)
const BASE_PLAYER = { x: 120, w: 50, h: 50 };


const player = {
  x: BASE_PLAYER.x,
  y: cfg.groundY,
  w: BASE_PLAYER.w,
  h: BASE_PLAYER.h,
  vy: 0,
  onGround: true, 
};

    function resizeCanvas() {
  const canvasEl = canvasRef.current;
if (!canvasEl) return;

const ctxMaybe = canvasEl.getContext("2d");
if (!ctxMaybe) return;

  const parent = canvasEl.parentElement as HTMLElement | null;

const ctx: CanvasRenderingContext2D = ctxMaybe;
  const cssW = parent ? parent.clientWidth : cfg.width;

  // Keep your native aspect ratio (960×320 = 3:1)
  const cssH = Math.round(cssW * (cfg.height / cfg.width));

  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  canvasEl.width = Math.floor(cssW * dpr);
  canvasEl.height = Math.floor(cssH * dpr);

  // Let CSS control displayed size
  canvasEl.style.width = `${cssW}px`;
 canvasEl.style.height = `${cssH}px`;

  // Make 1 unit in code = 1 CSS pixel
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // IMPORTANT: update cfg-like values you use for drawing
  view.w = cssW;
  view.h = cssH;

  // apply mobile sizing/positioning AFTER view.w is known
  if (isMobileView()) {
    player.w = Math.round(BASE_PLAYER.w * 0.82);
    player.h = Math.round(BASE_PLAYER.h * 0.82);
    player.x = Math.round(BASE_PLAYER.x * 0.78);
  } else {
    player.w = BASE_PLAYER.w;
    player.h = BASE_PLAYER.h;
    player.x = BASE_PLAYER.x;
  }

  // Scale your game coordinates from the base design size to the view size
  view.sx = cssW / cfg.width;
  view.sy = cssH / cfg.height;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

    // -------- internal game state --------
    let raf = 0;
    let last = performance.now();

    let t = 0;
    let runTime = 0;
    let motionTime = 0; // advances only while RUNNING

    let internalScore = 0;
    let speed = cfg.baseSpeed;

    let nextSpeedUpAt = randRange(cfg.speedupMinS, cfg.speedupMaxS);
    let speedupsCount = 0;

    let jumps = 0;
    let runStartMs = 0;

    const groundLineY = () => cfg.groundY + player.h;

    // ---------------- Clouds ----------------
    type Cloud = {
      x: number;
      y: number;
      w: number;
      h: number;
      speed: number; // px/sec
      alpha: number;
      glow: "cyan" | "pink" | "white";
    };

    let clouds: Cloud[] = [];

    function spawnCloud(seedX?: number) {
      const w = randRange(70, 170);
      const h = randRange(22, 55);
      const y = randRange(30, Math.max(40, groundLineY() - 140)); // stay above ground line
      const cSpeed = randRange(18, 45);
      const alpha = randRange(0.12, 0.28);

      const glowRoll = Math.random();
      const glow: Cloud["glow"] =
        glowRoll < 0.45 ? "cyan" : glowRoll < 0.85 ? "pink" : "white";

      clouds.push({
        x: seedX ?? (cfg.width + randRange(10, 180)),
        y,
        w,
        h,
        speed: cSpeed,
        alpha,
        glow,
      });
    }

    function drawCloudShape(x: number, y: number, w: number, h: number) {
      const r1 = h * 0.55;
      const r2 = h * 0.45;
      const r3 = h * 0.5;

      ctx.beginPath();
      ctx.arc(x + w * 0.25, y + h * 0.6, r1, Math.PI * 0.9, Math.PI * 2.1);
      ctx.arc(x + w * 0.45, y + h * 0.4, r2, Math.PI * 1.0, Math.PI * 2.2);
      ctx.arc(x + w * 0.68, y + h * 0.58, r3, Math.PI * 0.9, Math.PI * 2.1);
      ctx.closePath();
    }

    function drawClouds() {
      for (const c of clouds) {
        let glowColor = "rgba(234,246,255,0.65)";
        if (c.glow === "cyan") glowColor = "rgba(102,204,255,0.70)";
        if (c.glow === "pink") glowColor = "rgba(255,80,200,0.65)";

        ctx.save();
        ctx.globalAlpha = c.alpha;

        ctx.shadowBlur = 22;
        ctx.shadowColor = glowColor;
        ctx.fillStyle = glowColor;

        drawCloudShape(c.x, c.y, c.w, c.h);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.globalAlpha = c.alpha * 0.45;
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        drawCloudShape(c.x + 6, c.y + 3, c.w - 12, c.h - 8);
        ctx.fill();

        ctx.restore();
      }
    }

    // ---------------- Stars ----------------
    const stars = Array.from({ length: 90 }).map(() => ({
      x: Math.random() * cfg.width,
      y: Math.random() * Math.max(20, groundLineY() - 70),
      r: 0.6 + Math.random() * 1.6,
      a: 0.35 + Math.random() * 0.65,
      tw: 0.5 + Math.random() * 1.6,
    }));

    function drawStars() {
      for (const s of stars) {
        // use motionTime so READY is still
        const tw = 0.25 * Math.sin(motionTime * s.tw) + 0.75;
        ctx.globalAlpha = Math.min(1, Math.max(0, s.a * tw));
        ctx.fillStyle = "rgba(234,246,255,1)";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // ---------------- Background ----------------
    function drawSkyAndGround() {
      const sky = ctx.createLinearGradient(0, 0, 0, groundLineY());
      sky.addColorStop(0, "rgba(6, 6, 18, 1)");
      sky.addColorStop(1, "rgba(12, 8, 30, 1)");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, cfg.width, groundLineY());

      const floor = ctx.createLinearGradient(0, groundLineY(), 0, cfg.height);
      floor.addColorStop(0, "rgba(4, 4, 12, 1)");
      floor.addColorStop(1, "rgba(1, 1, 6, 1)");
      ctx.fillStyle = floor;
      ctx.fillRect(0, groundLineY(), cfg.width, cfg.height - groundLineY());
    }

    function drawGroundLine() {
      glowLine(
        ctx,
        0,
        groundLineY(),
        cfg.width,
        groundLineY(),
        "rgba(255,80,200,0.55)",
        2,
        18,
      );

      ctx.save();
      ctx.globalAlpha = 0.14;
      const haze = ctx.createLinearGradient(0, groundLineY(), 0, groundLineY() + 40);
      haze.addColorStop(0, "rgba(255,80,200,0.9)");
      haze.addColorStop(1, "rgba(255,80,200,0)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, groundLineY(), cfg.width, 46);
      ctx.restore();
    }

    // ---------------- Obstacles ----------------
    type Ob = {
      x: number;
      y: number;
      w: number;
      h: number;
      emoji: string;
    };

    const EMOJIS = ["🥤", "🥪", "🥧", "🥗", "🍗"] as const;

function pickEmoji() {
  return EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
}

function spawnObstacleGroup() {
  const gap = 12;
  const w = 44;
  const h = 44;

  // How wide is a triple train?
  const tripleWidth = w * 3 + gap * 2;

  // Safety buffer (extra pixels so it's not razor-thin)
  const buffer = 26;

  // Approx air-time of a jump (seconds)
  const airTime = (2 * cfg.jumpVel) / cfg.gravity;

  // If current speed can clear a triple comfortably, unlock triples (Tier 1)
  const triplesUnlocked = speed * airTime >= tripleWidth + buffer;

  // Start: singles + doubles
  // Tier 1+: triples can appear (rarely at first)
  let count = 1;

  if (!triplesUnlocked) {
    // 1–2 only
    count = Math.random() < 0.35 ? 2 : 1;
  } else {
    // 1 most common, 2 sometimes, 3 less common
    count = Math.random() < 0.16 ? 3 : Math.random() < 0.42 ? 2 : 1;
  }

  const emoji = pickEmoji();
  const startX = cfg.width + 20;

  for (let i = 0; i < count; i++) {
    obstacles.push({
      x: startX + i * (w + gap),
      y: groundLineY() - h,
      w,
      h,
      emoji,
    });
  }
}

    let obstacles: Ob[] = [];
    let distSinceSpawn = 0;

    function getHitbox() {
      return {
        x: player.x + cfg.hitInsetX,
        y: player.y + cfg.hitInsetY,
        w: player.w - cfg.hitInsetW,
        h: player.h - cfg.hitInsetH,
      };
    }

    function drawObstacle(o: Ob) {
      // neon glow behind the emoji
      ctx.save();
      ctx.shadowBlur = 18;
      ctx.shadowColor = "rgba(255,80,200,0.55)";
      ctx.globalAlpha = 0.95;

      // draw emoji centered in the obstacle box
      const fontSize = 34; // tweak if you want bigger
      ctx.font = `${fontSize}px ui-sans-serif, system-ui, "Apple Color Emoji", "Segoe UI Emoji"`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const cx = o.x + o.w / 2;
      const cy = o.y + o.h / 2 + 1;

      // optional subtle outline for readability
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.strokeText(o.emoji, cx, cy);

      ctx.fillText(o.emoji, cx, cy);
      ctx.restore();

      // reset text settings not strictly required, but keeps things clean
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
    }

    // ---------------- Runner ----------------
    function drawLenny() {
      const img = spriteRef.current;

      if (!img) {
        ctx.fillStyle = "rgba(102, 204, 255, 0.9)";
        roundRect(ctx, player.x, player.y, player.w, player.h, 12, true, false);
        return;
      }

      const pad = Math.max(1, Math.round(player.w * 0.04));
      ctx.drawImage(
        img,
        player.x - pad,
        player.y - pad,
        player.w + pad * 2,
        player.h + pad * 2,
      );
    }

    // ---------------- UI ----------------
    function drawOverlay(text: string) {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, cfg.width, cfg.height);
      ctx.fillStyle = "rgba(234,246,255,0.95)";
      ctx.font = "700 22px ui-sans-serif, system-ui";
      const w = ctx.measureText(text).width;
      ctx.fillText(text, cfg.width / 2 - w / 2, cfg.height / 2);
    }

    function drawHud() {
      ctx.fillStyle = "rgba(234,246,255,0.92)";
      ctx.font = "14px ui-sans-serif, system-ui";
      ctx.fillText(`Score: ${Math.floor(internalScore)}`, 18, 24);
      ctx.fillText(`HI: ${hi}`, 18, 44);
    }

    // ---------------- Flow ----------------
    function resetRun() {
      t = 0;
      runTime = 0;
      motionTime = 0;

      internalScore = 0;
      speed = cfg.baseSpeed;

      nextSpeedUpAt = randRange(cfg.speedupMinS, cfg.speedupMaxS);
      speedupsCount = 0;

      jumps = 0;
      runStartMs = 0;

      player.y = cfg.groundY;
      player.vy = 0;
      player.onGround = true;

      obstacles = [];
      distSinceSpawn = 200;

      // seed clouds across the sky
      clouds = [];
      for (let i = 0; i < 7; i++) spawnCloud(randRange(0, cfg.width));

      setScore(0);
      setSubmitMsg(null);
    }

    function toReady() {
      resetRun();
      setState("ready");
    }

    function startRunIfNeeded() {
      if (uiStateRef.current === "ready") {
        runStartMs = Date.now();
        setState("running");
      }
    }

    function jump() {
      if (uiStateRef.current !== "running") return;
      if (!player.onGround) return;
      player.vy = -cfg.jumpVel;
      player.onGround = false;
      jumps += 1;
    }

    async function submitRun(finalScore: number) {
      if (isGuest || !userId) {
        setSubmitMsg("Guest mode: run not submitted (no XP).");
        return;
      }

      try {
        setSubmitting(true);
        setSubmitMsg(null);

        const timeMs = runStartMs ? Math.max(0, Date.now() - runStartMs) : 0;

        const res = await fetch("/api/bitgalaxy/quests/complete-lunchbox-run", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            orgId,
            userId,
            score: Math.floor(finalScore),
            stats: {
              timeMs,
              jumps,
              speedups: speedupsCount,
            },
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setSubmitMsg(data?.error ?? "Could not submit run.");
          return;
        }

        setSubmitMsg(
          `Submitted • Tier ${data?.tier ?? "?"} • +${data?.xpAwarded ?? 0} XP`,
        );
      } finally {
        setSubmitting(false);
      }
    }

    function endGame() {
      const final = Math.floor(internalScore);

      const nextHi = Math.max(hi, final);
      if (nextHi !== hi) {
        setHi(nextHi);
        localStorage.setItem("bg_lunchbox_run_hi", String(nextHi));
      }

      setState("gameover");
      submitRun(final);
    }

    function update(dt: number) {
      if (uiStateRef.current !== "running") return;

      runTime += dt;

      // speed ramps every 6–10 seconds by 5–10%
      if (runTime >= nextSpeedUpAt && speed < cfg.maxSpeed) {
        const mult = randRange(cfg.speedupMinMult, cfg.speedupMaxMult);
        speed = Math.min(cfg.maxSpeed, speed * mult);
        speedupsCount += 1;
        nextSpeedUpAt += randRange(cfg.speedupMinS, cfg.speedupMaxS);
      }

      // score scales with time + speed
      internalScore += dt * (5 + speed * 0.05);
      setScore(Math.floor(internalScore));

      // clouds drift left
      for (const c of clouds) {
        c.x -= c.speed * dt + speed * 0.08 * dt;
      }
      clouds = clouds.filter((c) => c.x + c.w > -200);
      if (clouds.length < 9 && Math.random() < 0.03) spawnCloud();

      // player physics
      player.vy += cfg.gravity * dt;
      player.y += player.vy * dt;

      if (player.y >= cfg.groundY) {
        player.y = cfg.groundY;
        player.vy = 0;
        player.onGround = true;
      } else {
        player.onGround = false;
      }

      // spawn by distance traveled (roomy early game)
      distSinceSpawn += speed * dt;

      const warmupSeconds = 25;
      const warmupT = Math.min(runTime / warmupSeconds, 1);
      const earlyBonusGap = (1 - warmupT) * 220;

      // More natural spacing: mostly medium gaps, sometimes big gaps, rarely tight gaps.
      function weightedGapJitter() {
        const r = Math.random();
        if (r < 0.12) return randRange(-120, -20);  // rare: tighter
        if (r < 0.82) return randRange(0, 220);     // common: roomy/varied
        return randRange(220, 520);                 // occasional: big breathing room
      }

      const desiredGap =
        cfg.obstacleBaseGap +
        speed * cfg.obstacleGapScale +
        earlyBonusGap +
        weightedGapJitter();

      if (distSinceSpawn >= desiredGap) {
        spawnObstacleGroup();
        distSinceSpawn = 0;
      }

      for (const o of obstacles) o.x -= speed * dt;
      obstacles = obstacles.filter((o) => o.x + o.w > -60);

      // collisions
      const hb = getHitbox();
      for (const o of obstacles) {
        if (aabb(hb, o)) {
          endGame();
          break;
        }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, view.w, view.h);

      ctx.save();
      ctx.scale(view.sx, view.sy);

      // everything below stays in your 960×320 coordinate system
      drawSkyAndGround();
      drawStars();
      drawClouds();
      drawGroundLine();
      for (const o of obstacles) drawObstacle(o);
      drawLenny();
      drawHud();
      if (uiStateRef.current === "ready") drawOverlay("Press SPACE to start");
      else if (uiStateRef.current === "gameover") drawOverlay("Game Over — Press R");

      ctx.restore();
    }

    function tick(now: number) {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      t += dt;

      if (uiStateRef.current === "running") {
        motionTime += dt;
      }

      update(dt);
      draw();

      raf = requestAnimationFrame(tick);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        if (uiStateRef.current === "ready") startRunIfNeeded();
        else if (uiStateRef.current === "gameover") toReady();
        else jump();
      }

      if (e.code === "KeyR") {
        e.preventDefault();
        toReady();
      }
    }

    function onPointerDown(e: PointerEvent) {
      e.preventDefault(); // stops scroll/zoom on mobile taps
      if (uiStateRef.current === "ready") startRunIfNeeded();
      else if (uiStateRef.current === "gameover") toReady();
      else jump();
    }

    // Start loop + listeners
    window.addEventListener("keydown", onKeyDown);
    const wrap = wrapRef.current;
    window.addEventListener("pointerdown", onPointerDown, { passive: false });

    // initialize UI
    uiStateRef.current = "ready";
    setUiState("ready");
    resetRun();

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("pointerdown", onPointerDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg, orgId, userId, isGuest]);

  return (
    <div className="space-y-3">
    <div
      ref={wrapRef}
      className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden p-0 sm:p-3 touch-manipulation select-none"
    >
      <canvas ref={canvasRef} className="block w-full h-auto" />
    </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="text-white/70">
          Jump-only • Speed ramps every 6–10s by 5–10% •{" "}
          <span className="text-white/80">Score:</span> {score}{" "}
          <span className="text-white/50">/</span>{" "}
          <span className="text-white/80">HI:</span> {hi}
          {submitMsg ? (
            <span className="ml-2 text-white/80">• {submitMsg}</span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              localStorage.setItem("bg_lunchbox_run_hi", String(hi));
            }}
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 disabled:opacity-60"
            disabled={submitting}
            title="High score is auto-saved"
          >
            {submitting ? "Submitting..." : isGuest ? "Guest Mode" : "Online Mode"}
          </button>
        </div>
      </div>
    </div>
  );
}