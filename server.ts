import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { GameState, GAME_CONFIG } from './src/types';
import { updatePhysics, resetPuck } from './src/game/Physics';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

const PORT = 3000;

interface Room {
  id: string;
  players: {
    p1?: Socket;
    p2?: Socket;
  };
  state: GameState;
  lastUpdate: number;
  interval?: NodeJS.Timeout;
}

const rooms = new Map<string, Room>();
const playerToRoom = new Map<string, string>();

let waitingPlayer: Socket | null = null;

function createInitialState(): GameState {
  return {
    puck: { pos: { x: GAME_CONFIG.width / 2, y: GAME_CONFIG.height / 2 }, vel: { x: 0, y: 0 }, radius: GAME_CONFIG.puckRadius, mass: 1 },
    paddles: {
      p1: { pos: { x: GAME_CONFIG.width / 2, y: GAME_CONFIG.height - 50 }, vel: { x: 0, y: 0 }, radius: GAME_CONFIG.paddleRadius, mass: 5 },
      p2: { pos: { x: GAME_CONFIG.width / 2, y: 50 }, vel: { x: 0, y: 0 }, radius: GAME_CONFIG.paddleRadius, mass: 5 }
    },
    score: { p1: 0, p2: 0 },
    status: 'waiting'
  };
}

function startGameLoop(room: Room) {
  room.lastUpdate = Date.now();
  room.state.status = 'playing';
  
  room.interval = setInterval(() => {
    const now = Date.now();
    const dt = (now - room.lastUpdate) / 1000;
    room.lastUpdate = now;

    if (room.state.status === 'playing') {
      const state = room.state;
      // Calculate velocities for online paddles
      const anyP1 = state.paddles.p1 as any;
      if (anyP1.prevX !== undefined && dt > 0) {
        state.paddles.p1.vel.x = (state.paddles.p1.pos.x - anyP1.prevX) / dt;
        state.paddles.p1.vel.y = (state.paddles.p1.pos.y - anyP1.prevY) / dt;
      }
      anyP1.prevX = state.paddles.p1.pos.x;
      anyP1.prevY = state.paddles.p1.pos.y;

      const anyP2 = state.paddles.p2 as any;
      if (anyP2.prevX !== undefined && dt > 0) {
        state.paddles.p2.vel.x = (state.paddles.p2.pos.x - anyP2.prevX) / dt;
        state.paddles.p2.vel.y = (state.paddles.p2.pos.y - anyP2.prevY) / dt;
      }
      anyP2.prevX = state.paddles.p2.pos.x;
      anyP2.prevY = state.paddles.p2.pos.y;

      updatePhysics(room.state, GAME_CONFIG, dt);
      
      const currentStatus = room.state.status as string;
      if (currentStatus === 'scored') {
        io.to(room.id).emit('scored', room.state.score);
        setTimeout(() => {
          if (room.state.status !== 'gameover') {
            resetPuck(room.state, GAME_CONFIG, Math.random() > 0.5 ? 'p1' : 'p2');
            room.state.status = 'playing';
            room.lastUpdate = Date.now();
          }
        }, 1500);
      }
    }

    io.to(room.id).emit('gameState', room.state);

    if (room.state.status === 'gameover') {
      if (room.interval) clearInterval(room.interval);
      io.to(room.id).emit('gameover', room.state.winner);
      rooms.delete(room.id);
    }
  }, 1000 / 60); // 60 updates per second
}

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('joinMatchmaking', () => {
    if (waitingPlayer && waitingPlayer.id !== socket.id) {
      // Match found
      const roomId = `room_${Date.now()}`;
      const room: Room = {
        id: roomId,
        players: { p1: waitingPlayer, p2: socket },
        state: createInitialState(),
        lastUpdate: Date.now()
      };
      
      rooms.set(roomId, room);
      playerToRoom.set(waitingPlayer.id, roomId);
      playerToRoom.set(socket.id, roomId);
      
      waitingPlayer.join(roomId);
      socket.join(roomId);
      
      waitingPlayer.emit('matchFound', { role: 'p1', state: room.state });
      socket.emit('matchFound', { role: 'p2', state: room.state });
      
      waitingPlayer = null;
      
      // Give players 2 seconds to get ready before starting physics
      setTimeout(() => {
        if (rooms.has(roomId)) {
          const roomToStart = rooms.get(roomId)!;
          resetPuck(roomToStart.state, GAME_CONFIG, Math.random() > 0.5 ? 'p1' : 'p2');
          startGameLoop(roomToStart);
        }
      }, 2000);
      
    } else {
      waitingPlayer = socket;
      socket.emit('waiting');
    }
  });

  socket.on('paddleMove', (data: { pos: { x: number, y: number }, vel: { x: number, y: number } }) => {
    const roomId = playerToRoom.get(socket.id);
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room || room.state.status !== 'playing') return;

    if (room.players.p1?.id === socket.id) {
      room.state.paddles.p1.pos = data.pos;
      room.state.paddles.p1.vel = data.vel;
    } else if (room.players.p2?.id === socket.id) {
      room.state.paddles.p2.pos = data.pos;
      room.state.paddles.p2.vel = data.vel;
    }
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    if (waitingPlayer?.id === socket.id) waitingPlayer = null;
    
    const roomId = playerToRoom.get(socket.id);
    if (roomId) {
      const room = rooms.get(roomId);
      if (room) {
        if (room.interval) clearInterval(room.interval);
        io.to(roomId).emit('opponentDisconnected');
        rooms.delete(roomId);
      }
      playerToRoom.delete(socket.id);
    }
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
