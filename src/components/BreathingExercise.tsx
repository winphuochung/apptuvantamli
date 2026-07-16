import React, { useEffect, useRef } from 'react';
import p5 from 'p5';

interface BreathingExerciseProps {
  onComplete?: () => void;
}

export default function BreathingExercise({ onComplete }: BreathingExerciseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Instance = useRef<p5 | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = (p: p5) => {
      let phase = 0; // 0: Inhale (4s), 1: Hold (7s), 2: Exhale (8s)
      let phaseTimer = 0;
      let radius = 50;
      let targetRadius = 50;
      let particles: Particle[] = [];

      class Particle {
        pos: p5.Vector;
        vel: p5.Vector;
        baseRadius: number;
        colorOffset: number;
        
        constructor() {
          this.pos = p.createVector(p.random(p.width), p.random(p.height));
          this.vel = p.createVector(0, 0);
          this.baseRadius = p.random(2, 6);
          this.colorOffset = p.random(100);
        }

        update(center: p5.Vector, currentRadius: number, pPhase: number) {
          const d = p5.Vector.dist(this.pos, center);
          
          if (pPhase === 0) {
            // Inhale - pull inwards gently
            const force = p5.Vector.sub(center, this.pos);
            force.setMag(p.map(d, 0, p.width, 0.5, 0.01));
            this.vel.add(force);
          } else if (pPhase === 1) {
            // Hold - swirl around
            const dir = p5.Vector.sub(this.pos, center);
            dir.rotate(p.HALF_PI);
            dir.setMag(0.5);
            this.vel.lerp(dir, 0.1);
          } else {
            // Exhale - push outward softly
            const force = p5.Vector.sub(this.pos, center);
            force.setMag(p.map(d, 0, p.width, 0.1, 0.3));
            this.vel.add(force);
          }

          this.vel.limit(2);
          this.pos.add(this.vel);
          this.vel.mult(0.95); // Friction

          // Wrap edges
          if (this.pos.x < 0) this.pos.x = p.width;
          if (this.pos.x > p.width) this.pos.x = 0;
          if (this.pos.y < 0) this.pos.y = p.height;
          if (this.pos.y > p.height) this.pos.y = 0;
        }

        draw(pPhase: number) {
          p.noStroke();
          const alpha = p.map(this.vel.mag(), 0, 2, 50, 200);
          
          if (pPhase === 0) p.fill(74, 222, 128, alpha); // Green-ish
          else if (pPhase === 1) p.fill(250, 204, 21, alpha); // Yellow-ish
          else p.fill(96, 165, 250, alpha); // Blue-ish

          p.circle(this.pos.x, this.pos.y, this.baseRadius);
        }
      }

      p.setup = () => {
        p.createCanvas(containerRef.current?.clientWidth || 400, 300);
        for (let i = 0; i < 150; i++) {
          particles.push(new Particle());
        }
      };

      p.draw = () => {
        p.background(255, 250, 245, 40); // Soft fade for trails
        
        const center = p.createVector(p.width / 2, p.height / 2);
        
        // Timer logic (60 fps assumed)
        phaseTimer++;
        
        let instruction = "";
        let timeRemaining = 0;

        if (phase === 0) {
          instruction = "Hít vào...";
          targetRadius = 150;
          timeRemaining = Math.ceil(4 - phaseTimer / 60);
          if (phaseTimer >= 4 * 60) {
            phase = 1;
            phaseTimer = 0;
          }
        } else if (phase === 1) {
          instruction = "Giữ hơi thở...";
          targetRadius = 160;
          timeRemaining = Math.ceil(7 - phaseTimer / 60);
          if (phaseTimer >= 7 * 60) {
            phase = 2;
            phaseTimer = 0;
          }
        } else {
          instruction = "Thở ra từ từ...";
          targetRadius = 50;
          timeRemaining = Math.ceil(8 - phaseTimer / 60);
          if (phaseTimer >= 8 * 60) {
            phase = 0;
            phaseTimer = 0;
          }
        }

        // Smoothly interpolate radius
        radius = p.lerp(radius, targetRadius, 0.02);

        // Update & Draw Particles
        for (let pt of particles) {
          pt.update(center, radius, phase);
          pt.draw(phase);
        }

        // Draw Central Circle
        p.noStroke();
        if (phase === 0) p.fill(74, 222, 128, 60);
        else if (phase === 1) p.fill(250, 204, 21, 60);
        else p.fill(96, 165, 250, 60);
        
        p.circle(center.x, center.y, radius * 2);
        
        p.fill(255, 255, 255, 150);
        p.circle(center.x, center.y, radius * 1.5);

        // Text
        p.textAlign(p.CENTER, p.CENTER);
        p.fill(50, 60, 70);
        p.textSize(18);
        p.text(instruction, center.x, center.y - 15);
        p.textSize(24);
        p.textStyle(p.BOLD);
        p.text(timeRemaining + "s", center.x, center.y + 15);
        p.textStyle(p.NORMAL);
      };

      p.windowResized = () => {
        p.resizeCanvas(containerRef.current?.clientWidth || 400, 300);
      };
    };

    p5Instance.current = new p5(sketch, containerRef.current);

    return () => {
      p5Instance.current?.remove();
    };
  }, []);

  return (
    <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center bg-rose-50/30 rounded-2xl overflow-hidden relative border border-rose-100">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 text-xs font-bold text-slate-500 bg-white/80 px-3 py-1 rounded-full shadow-sm backdrop-blur-sm border border-slate-100">
        Bài tập thở 4-7-8
      </div>
    </div>
  );
}
