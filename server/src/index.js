import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const app = express();
// CORS configuration - add your Railway/client domains here
const allowedOrigins = [
  'https://friendsbingo7.com',
  'https://admin.friendstech7.com',
  'http://localhost:5173',
  'http://localhost:3000',
  // Add your Railway client domain here after deployment
  process.env.CLIENT_URL, // Set this in Railway variables
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Serve audio files - check both possible locations
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Try server/audio first (production), then ../../audio (development)
const audioDir1 = path.join(__dirname, '..', 'audio');
const audioDir2 = path.resolve(__dirname, '..', '..', 'audio');
const audioDir = fs.existsSync(audioDir1) ? audioDir1 : audioDir2;
app.use('/audio', express.static(audioDir));

const server = http.createServer(app);
const io = new Server(server, { 
  cors: { 
    origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
    credentials: true
  } 
});

const ROOM_ID = 'main';
const BOARD_SIZE = 75; // BINGO: B(1-15), I(16-30), N(31-45), G(46-60), O(61-75)
const COUNTDOWN_SECONDS = 60;
const CALL_INTERVAL_MS = 3000;

let state = {
  phase: 'lobby',
  countdown: COUNTDOWN_SECONDS,
  players: new Map(),
  stake: 10,
  called: [],
  timer: null,
  caller: null,
};

function getOnlinePlayers() {
  return Array.from(state.players.values());
}

function computePrizePool() {
  const total = getOnlinePlayers().length * state.stake;
  return Math.floor(total * 0.8);
}

function startCountdown() {
  clearInterval(state.timer);
  state.phase = 'countdown';
  state.countdown = COUNTDOWN_SECONDS;
  state.called = [];
  io.to(ROOM_ID).emit('phase', { phase: state.phase });
  io.to(ROOM_ID).emit('tick', { seconds: state.countdown, players: getOnlinePlayers().length, prize: computePrizePool(), stake: state.stake });
  
  state.timer = setInterval(() => {
    state.countdown -= 1;
    io.to(ROOM_ID).emit('tick', { seconds: state.countdown, players: getOnlinePlayers().length, prize: computePrizePool(), stake: state.stake });
    
    if (state.countdown <= 0) {
      clearInterval(state.timer);
      // Only start calling if there are players with boards selected
      const playersWithBoards = getOnlinePlayers().filter(p => p.picks && p.picks.length > 0);
      if (playersWithBoards.length > 0) {
        startCalling();
      } else {
        // No players ready, restart lobby
        state.phase = 'lobby';
        io.to(ROOM_ID).emit('phase', { phase: state.phase });
        startCountdown();
      }
    }
  }, 1000);
}

function startCalling() {
  state.phase = 'calling';
  io.to(ROOM_ID).emit('phase', { phase: state.phase });
  io.to(ROOM_ID).emit('game_start');
  
  // Generate BINGO numbers: B(1-15), I(16-30), N(31-45), G(46-60), O(61-75)
  const numbers = [];
  for (let i = 1; i <= 75; i++) {
    numbers.push(i);
  }
  
  // Shuffle the numbers
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  
  let idx = 0;
  clearInterval(state.caller);
  state.caller = setInterval(() => {
    if (idx >= numbers.length) {
      clearInterval(state.caller);
      // Game over, restart lobby
      state.phase = 'lobby';
      io.to(ROOM_ID).emit('phase', { phase: state.phase });
      startCountdown();
      return;
    }
    const n = numbers[idx++];
    state.called.push(n);
    io.to(ROOM_ID).emit('call', { number: n, called: state.called });
  }, CALL_INTERVAL_MS);
}

io.on('connection', (socket) => {
  socket.join(ROOM_ID);
  state.players.set(socket.id, { 
    id: socket.id, 
    name: `Player-${socket.id.slice(0,4)}`, 
    stake: state.stake, 
    picks: [],
    ready: false
  });
  io.to(ROOM_ID).emit('players', { count: getOnlinePlayers().length });

  socket.emit('init', { 
    phase: state.phase, 
    seconds: state.countdown, 
    stake: state.stake, 
    prize: computePrizePool(), 
    called: state.called, 
    playerId: socket.id 
  });

  socket.on('select_numbers', (picks) => {
    if (!Array.isArray(picks) || picks.length > 2) return;
    const player = state.players.get(socket.id);
    if (!player) return;
    player.picks = picks;
  });

  socket.on('start_game', () => {
    const player = state.players.get(socket.id);
    if (!player || player.picks.length === 0) return;
    player.ready = true;
    
    // Confirm the player is ready and redirect them to game page
    socket.emit('start_game_confirm');
    
    // If we're in countdown phase and player is ready, they can join the game
    if (state.phase === 'countdown') {
      // Player is ready to play, they'll be redirected to game page
      socket.emit('game_start');
    }
  });

  // Allow clients to choose a stake (bet house)
  socket.on('set_stake', (amount) => {
    const num = Number(amount)
    if (!Number.isFinite(num) || num <= 0) return
    state.stake = num
    io.to(ROOM_ID).emit('tick', { seconds: state.countdown, players: getOnlinePlayers().length, prize: computePrizePool(), stake: state.stake })
  })

  socket.on('bingo', () => {
    const player = state.players.get(socket.id);
    if (!player || !player.picks || player.picks.length === 0) return;
    
    // For now, simple validation - in real implementation, you'd validate the actual board
    const hasValidBingo = true; // Placeholder - implement actual board validation
    
    if (hasValidBingo) {
      io.to(ROOM_ID).emit('winner', { playerId: socket.id, prize: computePrizePool() });
      clearInterval(state.caller);
      clearInterval(state.timer);
      // Reset all players
      state.players.forEach(p => {
        p.picks = [];
        p.ready = false;
      });
      state.phase = 'lobby';
      io.to(ROOM_ID).emit('phase', { phase: state.phase });
      startCountdown();
    } else {
      // Invalid bingo - disqualify player
      player.disqualified = true;
      socket.emit('bingo_result', { valid: false, message: 'Invalid BINGO!' });
    }
  });

  socket.on('disconnect', () => {
    state.players.delete(socket.id);
    io.to(ROOM_ID).emit('players', { count: getOnlinePlayers().length });
  });
});

app.get('/', (_req, res) => {
  res.send('Go Bingo server running');
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`Server listening on ${HOST}:${PORT}`);
  if (!state.timer && state.phase === 'lobby') startCountdown();
});

// Error handling
server.on('error', (err) => {
  console.error('Server error:', err);
});