import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { Button } from './Button';
import { Radio, AlertCircle } from 'lucide-react';
import { ROLES } from '../constants';
import { supabase } from '../supabaseClient';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [ra, setRa] = useState('');
  const [role, setRole] = useState(ROLES[0]);
  const [networkLogin, setNetworkLogin] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animation Effect (Mantido igual)
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
    class Beam {
      x: number; speed: number; width: number; color: string; amplitude: number; frequency: number; phase: number;
      constructor() {
        this.x = Math.random() * width; this.speed = Math.random() * 0.002 + 0.001; this.width = Math.random() * 100 + 50;
        this.amplitude = Math.random() * 100 + 50; this.frequency = Math.random() * 0.005 + 0.002; this.phase = Math.random() * Math.PI * 2;
        const colors = ['hsla(200, 80%, 70%, 0.1)', 'hsla(280, 70%, 75%, 0.1)', 'hsla(320, 60%, 80%, 0.1)', 'hsla(180, 50%, 90%, 0.15)'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }
      update() { this.phase += this.speed; }
      draw() {
        if (!ctx) return; ctx.beginPath();
        for (let y = 0; y <= height; y += 10) {
          const xOffset = Math.sin(y * this.frequency + this.phase) * this.amplitude + Math.sin(y * (this.frequency * 0.5) + this.phase * 1.5) * (this.amplitude * 0.5);
          const x = this.x + xOffset; y === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.lineWidth = this.width; ctx.strokeStyle = this.color; ctx.shadowBlur = 20; ctx.shadowColor = "rgba(255, 255, 255, 0.2)"; ctx.lineCap = 'round'; ctx.stroke(); ctx.shadowBlur = 0;
      }
    }
    const beams: Beam[] = [];
    for (let i = 0; i < 12; i++) { beams.push(new Beam()); }
    let animationId: number;
    const loop = () => {
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, '#0f172a'); bgGradient.addColorStop(1, '#1e293b');
      ctx.fillStyle = bgGradient; ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';
      beams.forEach(beam => { beam.update(); beam.draw(); });
      ctx.globalCompositeOperation = 'source-over';
      animationId = requestAnimationFrame(loop);
    };
    loop();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animationId); };
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        if (isLoginMode) {
            // LOGIN
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            if (data.user) {
                // Fetch Profile Data
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();
                
                if (profileError) throw profileError;

                onLogin({
                    id: data.user.id,
                    email: data.user.email,
                    name: profile.name,
                    ra: profile.ra,
                    role: profile.role,
                    networkLogin: profile.network_login
                });
            }
        } else {
            // SIGN UP
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                        ra,
                        role,
                        network_login: networkLogin
                    }
                }
            });

            if (error) throw error;
            if (data.user) {
                // Auto login on signup if successful
                 onLogin({
                    id: data.user.id,
                    email: data.user.email,
                    name: name,
                    ra: ra,
                    role: role,
                    networkLogin: networkLogin
                });
            }
        }
    } catch (err: any) {
        setError(err.message || 'Erro ao autenticar');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up">
        <div className="flex justify-center text-blue-600">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-full shadow-2xl border border-white/20">
                <Radio className="h-12 w-12 text-white animate-pulse" />
            </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white drop-shadow-md">
          TelcoFlow Manager
        </h2>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in">
        <div className="bg-white/90 backdrop-blur-md py-8 px-4 shadow-2xl sm:rounded-xl sm:px-10 border border-white/40">
          
          <div className="flex justify-center mb-6 border-b border-slate-200">
             <button 
                onClick={() => setIsLoginMode(true)}
                className={`pb-2 px-4 text-sm font-medium transition-colors ${isLoginMode ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
             >
                 Entrar
             </button>
             <button 
                onClick={() => setIsLoginMode(false)}
                className={`pb-2 px-4 text-sm font-medium transition-colors ${!isLoginMode ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
             >
                 Cadastrar
             </button>
          </div>

          {error && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
                  <div className="flex">
                      <div className="flex-shrink-0">
                          <AlertCircle className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="ml-3">
                          <p className="text-sm text-red-700">{error}</p>
                      </div>
                  </div>
              </div>
          )}

          <form className="space-y-4" onSubmit={handleAuth}>
            
            {!isLoginMode && (
                <>
                    <div>
                    <label className="block text-sm font-medium text-slate-700">Nome Completo</label>
                    <input
                        type="text" required={!isLoginMode}
                        className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white/50"
                        value={name} onChange={e => setName(e.target.value)}
                    />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                        <label className="block text-sm font-medium text-slate-700">RA</label>
                        <input
                            type="text" required={!isLoginMode}
                            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white/50"
                            value={ra} onChange={e => setRa(e.target.value)}
                        />
                        </div>
                        <div>
                        <label className="block text-sm font-medium text-slate-700">Login Rede</label>
                        <input
                            type="text" required={!isLoginMode}
                            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white/50"
                            value={networkLogin} onChange={e => setNetworkLogin(e.target.value)}
                        />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Cargo</label>
                        <select
                            required={!isLoginMode}
                            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white/50"
                            value={role} onChange={e => setRole(e.target.value)}
                        >
                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700">E-mail</label>
              <input
                type="email" required
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white/50"
                value={email} onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Senha</label>
              <input
                type="password" required
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white/50"
                value={password} onChange={e => setPassword(e.target.value)}
              />
            </div>

            <div className="pt-2">
              <Button type="submit" isLoading={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg text-white font-bold" size="lg">
                {isLoginMode ? 'Entrar no Sistema' : 'Criar Conta'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
