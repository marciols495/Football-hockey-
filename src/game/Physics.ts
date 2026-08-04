import { Circle, GameConfig, GameState, Vector2, GAME_CONFIG } from '../types';

export function distance(v1: Vector2, v2: Vector2): number {
  const dx = v1.x - v2.x;
  const dy = v1.y - v2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function resolveCollision(c1: Circle, c2: Circle, config: GameConfig) {
  const dist = distance(c1.pos, c2.pos);
  const minDist = c1.radius + c2.radius;

  if (dist < minDist) {
    // Penetration resolution
    const overlap = minDist - dist;
    const nx = dist === 0 ? 0 : (c2.pos.x - c1.pos.x) / dist;
    const ny = dist === 0 ? 1 : (c2.pos.y - c1.pos.y) / dist;

    // Move puck (c2) only, to avoid paddles being pushed around or into walls
    c2.pos.x += nx * overlap;
    c2.pos.y += ny * overlap;
    
    // Immediately constrain puck to the board so the paddle can't push it out of bounds
    const isGoalX = c2.pos.x > (config.width - config.goalWidth) / 2 && c2.pos.x < (config.width + config.goalWidth) / 2;
    if (c2.pos.x - c2.radius < 0) c2.pos.x = c2.radius;
    if (c2.pos.x + c2.radius > config.width) c2.pos.x = config.width - c2.radius;
    if (!isGoalX) {
       if (c2.pos.y - c2.radius < 0) c2.pos.y = c2.radius;
       if (c2.pos.y + c2.radius > config.height) c2.pos.y = config.height - c2.radius;
    }

    // Velocity resolution (Elastic collision)
    const kx = c1.vel.x - c2.vel.x;
    const ky = c1.vel.y - c2.vel.y;
    
    // Impact speed
    const totalMass = c1.mass + c2.mass;
    const p = 2 * (nx * kx + ny * ky) / totalMass;
    
    // Only apply velocity if they are moving towards each other
    if (p > 0) {
       c2.vel.x += p * c1.mass * nx;
       c2.vel.y += p * c1.mass * ny;
    }
    
    // Anti-stuck logic: If heavily overlapped or completely dead inside the paddle
    const currentSpeed = Math.sqrt(c2.vel.x ** 2 + c2.vel.y ** 2);
    if (overlap > 8 || (overlap > 2 && currentSpeed < 100)) {
       // The user requested to shoot the ball sideways when stuck
       c2.vel.x = (c2.pos.x > config.width / 2 ? -800 : 800);
       c2.vel.y = (c2.pos.y > config.height / 2 ? -300 : 300);
    }
  }
}

export function updatePhysics(state: GameState, config: GameConfig, dt: number) {
  if (state.status !== 'playing') return;

  const { puck, paddles } = state;

  // Apply velocity to puck
  puck.pos.x += puck.vel.x * dt;
  puck.pos.y += puck.vel.y * dt;

  // Apply friction
  const frictionFactor = Math.pow(config.friction, dt * 60);
  puck.vel.x *= frictionFactor;
  puck.vel.y *= frictionFactor;

  // Wall collisions for puck
  if (puck.pos.x - puck.radius < 0) {
    puck.pos.x = puck.radius;
    puck.vel.x *= -1;
  } else if (puck.pos.x + puck.radius > config.width) {
    puck.pos.x = config.width - puck.radius;
    puck.vel.x *= -1;
  }

  // Y wall collisions (Goal logic)
  const isGoalX = puck.pos.x > (config.width - config.goalWidth) / 2 && puck.pos.x < (config.width + config.goalWidth) / 2;
  
  if (puck.pos.y - puck.radius < 0) {
    if (isGoalX) {
      state.score.p1 += 1;
      puck.vel.x = 0;
      puck.vel.y = 0;
      puck.pos.y = puck.radius;
      checkGoal(state, config, 'p1');
      return; // Exit to prevent paddle collision from pushing puck off-screen
    } else {
      puck.pos.y = puck.radius;
      puck.vel.y *= -1;
    }
  } else if (puck.pos.y + puck.radius > config.height) {
    if (isGoalX) {
      state.score.p2 += 1;
      puck.vel.x = 0;
      puck.vel.y = 0;
      puck.pos.y = config.height - puck.radius;
      checkGoal(state, config, 'p2');
      return; // Exit to prevent paddle collision from pushing puck off-screen
    } else {
      puck.pos.y = config.height - puck.radius;
      puck.vel.y *= -1;
    }
  }

  // Constrain paddles
  constrainPaddle(paddles.p1, config, true);
  constrainPaddle(paddles.p2, config, false);

  // Paddle-Puck collisions
  resolveCollision(paddles.p1, puck, config);
  resolveCollision(paddles.p2, puck, config);
  
  // Max speed for puck
  const maxSpeed = 1500; // pixels per second
  const currentSpeed = Math.sqrt(puck.vel.x ** 2 + puck.vel.y ** 2);
  if (currentSpeed > maxSpeed) {
    puck.vel.x = (puck.vel.x / currentSpeed) * maxSpeed;
    puck.vel.y = (puck.vel.y / currentSpeed) * maxSpeed;
  }
}

function constrainPaddle(paddle: Circle, config: GameConfig, isBottom: boolean) {
  paddle.pos.x = Math.max(paddle.radius, Math.min(config.width - paddle.radius, paddle.pos.x));
  
  if (isBottom) {
    paddle.pos.y = Math.max(config.height / 2 + paddle.radius, Math.min(config.height - paddle.radius, paddle.pos.y));
  } else {
    paddle.pos.y = Math.max(paddle.radius, Math.min(config.height / 2 - paddle.radius, paddle.pos.y));
  }
}

function checkGoal(state: GameState, config: GameConfig, scorer: 'p1' | 'p2') {
  if (state.score.p1 >= config.maxScore || state.score.p2 >= config.maxScore) {
    state.status = 'gameover';
    state.winner = state.score.p1 >= config.maxScore ? 'p1' : 'p2';
  } else {
    state.status = 'scored';
  }
}

export function resetPuck(state: GameState, config: GameConfig, server: 'p1' | 'p2' = 'p1') {
  const yPos = server === 'p1' ? config.height / 2 + 80 : config.height / 2 - 80;
  state.puck.pos = { x: config.width / 2, y: yPos };
  state.puck.vel = { x: 0, y: 0 }; // Start stationary so the server hits it
  // Do not reset paddles, let players keep their positions
}
