"use client";
import { useEffect, useRef } from "react";

export default function DotCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let dots: Array<{
      bx: number;
      by: number;
      ox: number;
      oy: number;
      vx: number;
      vy: number;
    }> = [];
    const SP = 40;
    const R = 1;
    let animationFrameId = 0;

    function init() {
      if (!canvas) return;
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      dots = [];
      for (let x = 0; x < W + SP; x += SP) {
        for (let y = 0; y < H + SP; y += SP) {
          dots.push({
            bx: x,
            by: y,
            ox: 0,
            oy: 0,
            vx: (Math.random() - 0.5) * 0.18,
            vy: (Math.random() - 0.5) * 0.18,
          });
        }
      }
    }

    function draw(t: number) {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#ADADA7";
      for (let d of dots) {
        d.ox += d.vx + Math.sin(t * 0.00025 + d.bx * 0.009) * 0.14;
        d.oy += d.vy + Math.cos(t * 0.0003 + d.by * 0.011) * 0.14;
        if (Math.abs(d.ox) > 7) d.vx *= -1;
        if (Math.abs(d.oy) > 7) d.vy *= -1;
        ctx.beginPath();
        ctx.arc(d.bx + d.ox, d.by + d.oy, R, 0, Math.PI * 2);
        ctx.fill();
      }
      animationFrameId = requestAnimationFrame(draw);
    }

    init();
    window.addEventListener("resize", init);
    animationFrameId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", init);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} id="dot-canvas" aria-hidden="true" />;
}
