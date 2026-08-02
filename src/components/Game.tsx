import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, GAME_CONFIG, Vector2 } from '../types';
import { updatePhysics, resetPuck } from '../game/Physics';
import { NeonButton, NeonTitle } from './NeonUI';
import { cn } from '../lib/utils';
import { initAudio, playHitSound, playGoalSound } from '../lib/audio';
import { Users, User, Monitor, Trophy, Pause, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type PlayMode = 'menu' | 'difficulty_select' | 'local' | 'ai' | 'online_waiting' | 'online_playing' | 'gameover' | 'tactics' | 'ranking';

import { useTeamStore } from '../lib/store';
import { Tactics } from './Tactics';
import { Ranking } from './Ranking';

export default function Game() {
  const [mode, setMode] = useState<PlayMode>('menu');
  const { players, activePlayerId, incrementGoals, setActivePlayer } = useTeamStore();
  const [isSubstituting, setIsSubstituting] = useState(false);

  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerRole, setPlayerRole] = useState<'p1' | 'p2'>('p1');
  const [winner, setWinner] = useState<'p1' | 'p2' | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const requestRef = useRef<number>(null);
  const isPausedRef = useRef(false);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);
  
  // Audio state refs
  const prevScoreRef = useRef<{ p1: number, p2: number }>({ p1: 0, p2: 0 });
  const prevPuckVelRef = useRef<{ x: number, y: number }>({ x: 0, y: 0 });
  
  // Local state for non-online modes
  const localStateRef = useRef<GameState | null>(null);
  const lastTimeRef = useRef<number>(0);
  
  // Mouse/Touch tracking
  const inputRef = useRef<{ x: number, y: number } | null>(null);

  // Initialize socket once
  useEffect(() => {
    // Only connect when needed or keep a background connection
    const socket = io();
    socketRef.current = socket;

    socket.on('matchFound', (data: { role: 'p1' | 'p2', state: GameState }) => {
      setPlayerRole(data.role);
      setGameState(data.state);
      setMode('online_playing');
    });

    socket.on('gameState', (state: GameState) => {
      setGameState(state);
    });

    socket.on('scored', (score) => {
      // Could add visual flair here
    });

    socket.on('gameover', (winner: 'p1' | 'p2') => {
      setWinner(winner);
      setMode('gameover');
    });

    socket.on('opponentDisconnected', () => {
      alert("Opponent disconnected!");
      setMode('menu');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const startLocalGame = (isAI: boolean) => {
    initAudio();
    const initialState: GameState = {
      puck: { pos: { x: GAME_CONFIG.width / 2, y: GAME_CONFIG.height / 2 }, vel: { x: 0, y: 0 }, radius: GAME_CONFIG.puckRadius, mass: 1 },
      paddles: {
        p1: { pos: { x: GAME_CONFIG.width / 2, y: GAME_CONFIG.height - 50 }, vel: { x: 0, y: 0 }, radius: GAME_CONFIG.paddleRadius, mass: 5 },
        p2: { pos: { x: GAME_CONFIG.width / 2, y: 50 }, vel: { x: 0, y: 0 }, radius: GAME_CONFIG.paddleRadius, mass: 5 }
      },
      score: { p1: 0, p2: 0 },
      status: 'playing'
    };
    localStateRef.current = initialState;
    resetPuck(initialState, GAME_CONFIG, isAI ? 'p1' : (Math.random() > 0.5 ? 'p1' : 'p2'));
    setGameState(initialState);
    setPlayerRole('p1');
    setMode(isAI ? 'ai' : 'local');
    lastTimeRef.current = performance.now();
  };

  const startOnlineGame = () => {
    initAudio();
    setMode('online_waiting');
    socketRef.current?.emit('joinMatchmaking');
  };

  // Audio Event Detection
  useEffect(() => {
    if (!gameState) return;

    // Detect Score Change
    if (gameState.score.p1 !== prevScoreRef.current.p1 || gameState.score.p2 !== prevScoreRef.current.p2) {
      playGoalSound();
      if (gameState.score.p1 > prevScoreRef.current.p1 && activePlayerId) {
        incrementGoals(activePlayerId);
      }
    }
    prevScoreRef.current = { ...gameState.score };

    // Detect Bounces
    const prevVel = prevPuckVelRef.current;
    const currVel = gameState.puck.vel;
    const speed = Math.sqrt(currVel.x ** 2 + currVel.y ** 2);
    
    if (speed > 50) {
      const dx = currVel.x - prevVel.x;
      const dy = currVel.y - prevVel.y;
      const diffSq = dx * dx + dy * dy;
      
      // If the velocity difference squared is large, it's a bounce
      if (diffSq > 20000) {
        playHitSound();
      }
    }
    
    prevPuckVelRef.current = { ...currVel };
  }, [gameState]);

  // Local Game Loop
  useEffect(() => {
    if (mode !== 'local' && mode !== 'ai') return;

    const loop = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      let dt = (time - lastTimeRef.current) / 1000;
      // Cap dt to prevent physics explosion if tab was backgrounded
      if (dt > 0.1) dt = 0.1;
      
      lastTimeRef.current = time;

      const state = localStateRef.current;
      if (!state) return;

      // Always calculate and update paddle velocities to prevent massive deltas after pauses
      const anyP1 = state.paddles.p1 as any;
      if (anyP1.prevX !== undefined && dt > 0) {
        state.paddles.p1.vel.x = (state.paddles.p1.pos.x - anyP1.prevX) / dt;
        state.paddles.p1.vel.y = (state.paddles.p1.pos.y - anyP1.prevY) / dt;
      }
      anyP1.prevX = state.paddles.p1.pos.x;
      anyP1.prevY = state.paddles.p1.pos.y;

      if (mode === 'local') {
        const anyP2 = state.paddles.p2 as any;
        if (anyP2.prevX !== undefined && dt > 0) {
          state.paddles.p2.vel.x = (state.paddles.p2.pos.x - anyP2.prevX) / dt;
          state.paddles.p2.vel.y = (state.paddles.p2.pos.y - anyP2.prevY) / dt;
        }
        anyP2.prevX = state.paddles.p2.pos.x;
        anyP2.prevY = state.paddles.p2.pos.y;
      }

      if (state.status === 'playing' && !isPausedRef.current) {
        // AI Logic
        if (mode === 'ai') {
          const aiPaddle = state.paddles.p2;
          const puck = state.puck;
          let maxSpeed = 400; // Medium
          if (aiDifficulty === 'easy') maxSpeed = 200;
          else if (aiDifficulty === 'hard') maxSpeed = 750;
          
          let targetX = GAME_CONFIG.width / 2;
          let targetY = GAME_CONFIG.height / 4;

          // If puck is on AI's side (top half), attack it
          if (puck.pos.y < GAME_CONFIG.height / 2 + 30) {
            const isPuckTrapped = puck.pos.y <= GAME_CONFIG.paddleRadius + GAME_CONFIG.puckRadius + 10;
            const isPuckInGoalX = puck.pos.x > (GAME_CONFIG.width - GAME_CONFIG.goalWidth) / 2 && puck.pos.x < (GAME_CONFIG.width + GAME_CONFIG.goalWidth) / 2;
            
            if (isPuckTrapped && !isPuckInGoalX) {
               // Anti-stuck: move away horizontally and down to free the puck
               targetX = puck.pos.x > GAME_CONFIG.width / 2 ? puck.pos.x - 80 : puck.pos.x + 80;
               targetY = GAME_CONFIG.paddleRadius + 60;
            } else {
               targetX = puck.pos.x;
               if (aiDifficulty === 'easy') {
                  targetX += Math.sin(time / 300) * 40; // Add some wobble for easy mode
               }
               // Get slightly above the puck to push it down
               targetY = puck.pos.y - 20;
            }
          } else {
             // Defend
             targetX = GAME_CONFIG.width / 2;
             targetY = GAME_CONFIG.paddleRadius + 30; // Stay near home
             
             // If puck is moving towards AI, track its X slightly
             if (puck.vel.y < 0) {
               targetX = Math.max(GAME_CONFIG.paddleRadius, Math.min(GAME_CONFIG.width - GAME_CONFIG.paddleRadius, puck.pos.x));
             }
          }

          const dx = targetX - aiPaddle.pos.x;
          const dy = targetY - aiPaddle.pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 5) {
            aiPaddle.vel.x = (dx / dist) * maxSpeed;
            aiPaddle.vel.y = (dy / dist) * maxSpeed;
          } else {
            aiPaddle.vel.x = 0;
            aiPaddle.vel.y = 0;
          }

          aiPaddle.pos.x += aiPaddle.vel.x * dt;
          aiPaddle.pos.y += aiPaddle.vel.y * dt;
        }

        updatePhysics(state, GAME_CONFIG, dt);
        const currentStatus = state.status as string;

        if (currentStatus === 'scored') {
          setTimeout(() => {
            if (localStateRef.current && localStateRef.current.status !== 'gameover') {
              resetPuck(localStateRef.current, GAME_CONFIG, mode === 'ai' ? 'p1' : (Math.random() > 0.5 ? 'p1' : 'p2'));
              localStateRef.current.status = 'playing';
            }
          }, 1500);
        }

        if (currentStatus === 'gameover') {
          setWinner(state.winner || null);
          setMode('gameover');
        }
      }

      setGameState({ ...state }); // trigger re-render for canvas
      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [mode]);

  // Input Handling for local and online
  const handleInput = (clientX: number, clientY: number, rect: DOMRect) => {
    const scaleX = GAME_CONFIG.width / rect.width;
    const scaleY = GAME_CONFIG.height / rect.height;
    
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    if (mode === 'online_playing' && socketRef.current) {
      // Calculate velocity simply based on previous pos (or just send pos)
      socketRef.current.emit('paddleMove', { pos: { x, y }, vel: { x: 0, y: 0 } });
    } else if (localStateRef.current) {
      const state = localStateRef.current;
      
      // Update p1 paddle based on input
      // If local mode (2 players on same device), could split screen touches.
      // For simplicity, mouse controls P1.
      if (mode === 'ai' || (mode === 'local' && y > GAME_CONFIG.height / 2)) {
        state.paddles.p1.pos = { x, y };
      } else if (mode === 'local' && y <= GAME_CONFIG.height / 2) {
        state.paddles.p2.pos = { x, y };
      }
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (canvasRef.current) {
      handleInput(e.clientX, e.clientY, canvasRef.current.getBoundingClientRect());
    }
  };

  // Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

    // Draw Table (Football Pitch)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.3;
    
    // Center line
    ctx.beginPath();
    ctx.moveTo(0, GAME_CONFIG.height / 2);
    ctx.lineTo(GAME_CONFIG.width, GAME_CONFIG.height / 2);
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(GAME_CONFIG.width / 2, GAME_CONFIG.height / 2, 60, 0, Math.PI * 2);
    ctx.stroke();

    // Penalty areas
    ctx.beginPath();
    ctx.rect((GAME_CONFIG.width - 200) / 2, 0, 200, 100);
    ctx.stroke();

    ctx.beginPath();
    ctx.rect((GAME_CONFIG.width - 200) / 2, GAME_CONFIG.height - 100, 200, 100);
    ctx.stroke();

    // Goals
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = 0.8;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo((GAME_CONFIG.width - GAME_CONFIG.goalWidth) / 2, 0);
    ctx.lineTo((GAME_CONFIG.width + GAME_CONFIG.goalWidth) / 2, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo((GAME_CONFIG.width - GAME_CONFIG.goalWidth) / 2, GAME_CONFIG.height);
    ctx.lineTo((GAME_CONFIG.width + GAME_CONFIG.goalWidth) / 2, GAME_CONFIG.height);
    ctx.stroke();

    ctx.globalAlpha = 1.0;

    // Draw Paddles
    const activePlayer = players.find(p => p.id === activePlayerId);

    const drawPaddle = (p: typeof gameState.paddles.p1, color: string, glow: string, name?: string) => {
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a'; // slate-900
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = color;
      ctx.shadowColor = glow;
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.shadowBlur = 0; // reset
      
      // inner ring
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, p.radius * 0.5, 0, Math.PI * 2);
      ctx.lineWidth = 3;
      ctx.stroke();

      if (name) {
         ctx.font = 'bold 12px "Space Grotesk", sans-serif';
         ctx.fillStyle = '#ffffff';
         ctx.textAlign = 'center';
         ctx.textBaseline = 'middle';
         ctx.fillText(name.substring(0, 3).toUpperCase(), p.pos.x, p.pos.y);
      }
    };

    drawPaddle(gameState.paddles.p1, '#10b981', '#34d399', activePlayer?.name || 'P1'); // Emerald
    drawPaddle(gameState.paddles.p2, '#ef4444', '#f87171', mode === 'ai' ? 'CPU' : 'P2'); // Red

    // Draw Puck (Football)
    const puck = gameState.puck;
    ctx.beginPath();
    ctx.arc(puck.pos.x, puck.pos.y, puck.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Football inner pattern
    ctx.beginPath();
    ctx.arc(puck.pos.x, puck.pos.y, puck.radius * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();

    // Draw Scores
    ctx.font = 'bold 64px "Space Grotesk", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.textAlign = 'center';
    
    ctx.save();
    ctx.translate(GAME_CONFIG.width / 2, GAME_CONFIG.height / 4);
    if (playerRole === 'p2') ctx.rotate(Math.PI);
    ctx.fillText(gameState.score.p2.toString(), 0, 0);
    ctx.restore();

    ctx.save();
    ctx.translate(GAME_CONFIG.width / 2, GAME_CONFIG.height * 0.75);
    if (playerRole === 'p2') ctx.rotate(Math.PI);
    ctx.fillText(gameState.score.p1.toString(), 0, 0);
    ctx.restore();

  }, [gameState, playerRole]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 overflow-hidden selection:bg-emerald-500/30">
      
      {/* Background ambient light */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-900/40 rounded-full blur-[120px] pointer-events-none" />

      <AnimatePresence mode="wait">
        {mode === 'menu' && (
          <motion.div 
            key="menu"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="z-10 flex flex-col items-center gap-12 max-w-md w-full"
          >
            <div className="text-center space-y-4">
              <NeonTitle text="Neon" className="text-4xl md:text-5xl" />
              <NeonTitle text="Air Hockey" />
              <p className="text-slate-400 font-medium tracking-wide">First to {GAME_CONFIG.maxScore} points wins</p>
            </div>

            <div className="flex flex-col gap-4 w-full px-8">
              <NeonButton onClick={() => setMode('difficulty_select')} variant="primary">
                <Monitor className="w-5 h-5" /> vs AI
              </NeonButton>
              <NeonButton onClick={() => startLocalGame(false)} variant="secondary">
                <Users className="w-5 h-5" /> Local PvP
              </NeonButton>
              <NeonButton onClick={startOnlineGame} variant="danger">
                <Users className="w-5 h-5" /> Online Match
              </NeonButton>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <NeonButton onClick={() => setMode('tactics')} variant="secondary" className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  Táticas
                </NeonButton>
                <NeonButton onClick={() => setMode('ranking')} variant="secondary" className="bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                  Ranking
                </NeonButton>
              </div>
            </div>
          </motion.div>
        )}

        {mode === 'tactics' && (
          <Tactics onBack={() => setMode('menu')} />
        )}
        
        {mode === 'ranking' && (
          <Ranking onBack={() => setMode('menu')} />
        )}

        {mode === 'difficulty_select' && (
          <motion.div 
            key="difficulty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="z-10 flex flex-col items-center gap-8 max-w-md w-full px-8"
          >
            <NeonTitle text="AI Level" className="text-4xl" />
            <div className="flex flex-col gap-4 w-full">
              <NeonButton onClick={() => { setAiDifficulty('easy'); startLocalGame(true); }} variant="primary">Easy</NeonButton>
              <NeonButton onClick={() => { setAiDifficulty('medium'); startLocalGame(true); }} variant="secondary">Medium</NeonButton>
              <NeonButton onClick={() => { setAiDifficulty('hard'); startLocalGame(true); }} variant="danger">Hard</NeonButton>
            </div>
            <button onClick={() => setMode('menu')} className="mt-4 text-slate-400 hover:text-white uppercase font-bold tracking-widest text-sm transition-colors">Back to Menu</button>
          </motion.div>
        )}

        {mode === 'online_waiting' && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="z-10 text-center space-y-8"
          >
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 border-t-4 border-cyan-400 rounded-full animate-spin"></div>
              <div className="absolute inset-2 border-b-4 border-purple-500 rounded-full animate-spin-reverse"></div>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-widest uppercase">Finding Opponent...</h2>
            <NeonButton onClick={() => {
              socketRef.current?.disconnect();
              socketRef.current?.connect(); // reconnect to leave pool
              setMode('menu');
            }} variant="secondary">
              Cancel
            </NeonButton>
          </motion.div>
        )}

        {mode === 'gameover' && (
          <motion.div
             key="gameover"
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="z-20 absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-8"
          >
            <Trophy className={cn("w-24 h-24", winner === playerRole ? "text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.8)]" : "text-pink-500 drop-shadow-[0_0_20px_rgba(236,72,153,0.8)]")} />
            <h2 className="text-5xl font-black uppercase text-white drop-shadow-md">
              {winner === playerRole ? 'Victory!' : 'Defeat'}
            </h2>
            <div className="flex gap-4">
              <NeonButton onClick={() => setMode('menu')} variant="primary">Main Menu</NeonButton>
            </div>
          </motion.div>
        )}

        {(mode === 'ai' || mode === 'local' || mode === 'online_playing') && (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-10 w-full max-w-[400px]"
          >
            <div className="flex justify-between items-center mb-4 text-white font-bold uppercase tracking-widest px-4">
              <div className={cn("flex items-center gap-2", playerRole === 'p2' ? "text-cyan-400" : "text-purple-400")}>
                <User size={18} /> P2 {playerRole === 'p2' && '(You)'}
              </div>
              <div className={cn("flex items-center gap-2", playerRole === 'p1' ? "text-cyan-400" : "text-purple-400")}>
                <User size={18} /> P1 {playerRole === 'p1' && '(You)'}
              </div>
            </div>

            <div className="relative rounded-xl border border-slate-800 bg-slate-900/50 shadow-2xl overflow-hidden p-2 backdrop-blur-md">
               <canvas
                 ref={canvasRef}
                 width={GAME_CONFIG.width}
                 height={GAME_CONFIG.height}
                 onPointerMove={onPointerMove}
                 onPointerDown={onPointerMove}
                 onTouchMove={(e) => {
                   if (canvasRef.current && e.touches[0]) {
                     handleInput(e.touches[0].clientX, e.touches[0].clientY, canvasRef.current.getBoundingClientRect());
                   }
                 }}
                 onTouchStart={(e) => {
                   if (canvasRef.current && e.touches[0]) {
                     handleInput(e.touches[0].clientX, e.touches[0].clientY, canvasRef.current.getBoundingClientRect());
                   }
                 }}
                 className={cn(
                   "w-full h-auto bg-slate-950 rounded-lg touch-none shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] border border-slate-800",
                   playerRole === 'p2' && "rotate-180" // Rotate table for player 2 so they are always at the bottom physically on their screen
                 )}
                 style={{
                   cursor: 'none'
                 }}
               />
               
               {gameState?.status === 'scored' && (
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <motion.div 
                     initial={{ scale: 0, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     exit={{ scale: 1.5, opacity: 0 }}
                     className="text-6xl font-black text-white italic drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]"
                   >
                     GOAL!
                   </motion.div>
                 </div>
               )}
            </div>

            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="flex justify-center gap-8">
                {(mode === 'local' || mode === 'ai') && (
                  <button 
                    onClick={() => setIsPaused(!isPaused)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white uppercase tracking-widest text-sm font-bold transition-colors"
                  >
                    {isPaused ? <Play size={16} /> : <Pause size={16} />}
                    {isPaused ? 'Resume' : 'Pause'}
                  </button>
                )}
                <button 
                  onClick={() => {
                    setIsPaused(true);
                    setIsSubstituting(true);
                  }}
                  className="flex items-center gap-2 text-slate-400 hover:text-white uppercase tracking-widest text-sm font-bold transition-colors"
                >
                  <Users size={16} />
                  Substituição
                </button>
                <button 
                  onClick={() => {
                    if (mode === 'online_playing') {
                       socketRef.current?.disconnect();
                       socketRef.current?.connect();
                    }
                    setMode('menu');
                  }}
                  className="text-slate-400 hover:text-white uppercase tracking-widest text-sm font-bold transition-colors"
                >
                  Quit Game
                </button>
              </div>
            </div>
            
            {isPaused && !isSubstituting && (
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                 <div className="bg-slate-950/80 backdrop-blur-sm p-8 rounded-2xl border border-slate-800 text-center pointer-events-auto">
                    <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-6">Paused</h2>
                    <NeonButton onClick={() => setIsPaused(false)} variant="primary">Resume</NeonButton>
                 </div>
               </div>
            )}

            {isSubstituting && (
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                 <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl pointer-events-auto p-4 flex flex-col max-h-[80vh]">
                    <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">Substituição</h2>
                    <div className="overflow-y-auto flex-1 flex flex-col gap-2 mb-4">
                      {players.map(p => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setActivePlayer(p.id);
                            setIsSubstituting(false);
                            setIsPaused(false);
                          }}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-xl border transition-colors",
                            p.id === activePlayerId
                              ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
                              : "bg-slate-950 border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-white"
                          )}
                        >
                          <div className="flex flex-col items-start">
                            <span className="font-bold">{p.name}</span>
                            <span className="text-[10px] text-slate-400">{p.position}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-black text-amber-500 text-sm">{p.rating}</span>
                            {p.id === activePlayerId && <span className="text-xs font-bold uppercase tracking-widest bg-emerald-500 text-emerald-950 px-2 py-0.5 rounded">Em Campo</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={() => setIsSubstituting(false)}
                      className="py-3 rounded-xl font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors w-full"
                    >
                      Cancelar
                    </button>
                 </div>
               </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
