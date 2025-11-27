import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { Button } from './Button';
import { Radio } from 'lucide-react';
import { ROLES } from '../constants';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [formData, setFormData] = useState<User>({
    name: '',
    ra: '',
    role: ROLES[0],
    networkLogin: ''
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);

    // Pearly Light Beams Class
    class Beam {
      x: number;
      speed: number;
      width: number;
      color: string;
      amplitude: number;
      frequency: number;
      phase: number;

      constructor() {
        this.x = Math.random() * width;
        this.speed = Math.random() * 0.002 + 0.001;
        this.width = Math.random() * 100 + 50;
        this.amplitude = Math.random() * 100 + 50;
        this.frequency = Math.random() * 0.005 + 0.002;
        this.phase = Math.random() * Math.PI * 2;
        
        // Pearly/Iridescent Colors (Soft Cyans, Pinks, Purples, Whites)
        const colors = [
          'hsla(200, 80%, 70%, 0.1)', // Soft Blue
          'hsla(280, 70%, 75%, 0.1)', // Soft Purple
          'hsla(320, 60%, 80%, 0.1)', // Soft Pink
          'hsla(180, 50%, 90%, 0.15)', // Pearly White/Cyan
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.phase += this.speed;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        
        // Draw a flowing curve from bottom to top
        for (let y = 0; y <= height; y += 10) {
          // Combine two sine waves for more organic "dancing" feel
          const xOffset = 
            Math.sin(y * this.frequency + this.phase) * this.amplitude +
            Math.sin(y * (this.frequency * 0.5) + this.phase * 1.5) * (this.amplitude * 0.5);
            
          const x = this.x + xOffset;
          
          if (y === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.lineWidth = this.width;
        ctx.strokeStyle = this.color;
        // Glow effect
        ctx.shadowBlur = 20;
        ctx.shadowColor = "rgba(255, 255, 255, 0.2)";
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset
      }
    }

    // Initialize Beams
    const beams: Beam[] = [];
    for (let i = 0; i < 12; i++) {
      beams.push(new Beam());
    }
    
    let animationId: number;

    const loop = () => {
      // Clear with transparency for trail effect? No, clean wipe looks better for smooth beams
      // Background Gradient
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, '#0f172a'); // Slate 900
      bgGradient.addColorStop(1, '#1e293b'); // Slate 800
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Enable additive blending for "glowing" intersection
      ctx.globalCompositeOperation = 'lighter';

      beams.forEach(beam => {
        beam.update();
        beam.draw();
      });

      // Reset composite operation for next frame/other elements
      ctx.globalCompositeOperation = 'source-over';

      animationId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.ra && formData.role && formData.networkLogin) {
      onLogin(formData);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Background Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up">
        <div className="flex justify-center text-blue-600">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-full shadow-2xl border border-white/20">
                <Radio className="h-12 w-12 text-white animate-pulse" />
            </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white drop-shadow-md">
          TelcoFlow Manager
        </h2>
        <p className="mt-2 text-center text-sm text-blue-100/80">
          Controle de Esteira de Telecom
        </p>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in">
        <div className="bg-white/90 backdrop-blur-md py-8 px-4 shadow-2xl sm:rounded-xl sm:px-10 border border-white/40">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                Nome Completo
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all bg-white/50"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label htmlFor="ra" className="block text-sm font-medium text-slate-700">
                RA (Registro)
              </label>
              <div className="mt-1">
                <input
                  id="ra"
                  name="ra"
                  type="text"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white/50"
                  value={formData.ra}
                  onChange={e => setFormData({...formData, ra: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-slate-700">
                Cargo / Função
              </label>
              <div className="mt-1">
                <select
                  id="role"
                  name="role"
                  required
                  className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white/50"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  {ROLES.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="login" className="block text-sm font-medium text-slate-700">
                Login de Rede
              </label>
              <div className="mt-1">
                <input
                  id="login"
                  name="login"
                  type="text"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white/50"
                  value={formData.networkLogin}
                  onChange={e => setFormData({...formData, networkLogin: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transform hover:-translate-y-0.5 transition-all text-white font-bold tracking-wide" size="lg">
                Entrar no Sistema
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
