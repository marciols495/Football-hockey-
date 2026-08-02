export interface Vector2 {
  x: number;
  y: number;
}

export interface Circle {
  pos: Vector2;
  vel: Vector2;
  radius: number;
  mass: number;
}

export interface GameState {
  puck: Circle;
  paddles: {
    p1: Circle; // bottom (local player 1)
    p2: Circle; // top (remote or AI or local player 2)
  };
  score: {
    p1: number;
    p2: number;
  };
  status: 'waiting' | 'playing' | 'scored' | 'gameover';
  winner?: 'p1' | 'p2';
}

export interface GameConfig {
  width: number;
  height: number;
  goalWidth: number;
  puckRadius: number;
  paddleRadius: number;
  friction: number;
  maxScore: number;
}

export const GAME_CONFIG: GameConfig = {
  width: 400,
  height: 600,
  goalWidth: 140,
  puckRadius: 18,
  paddleRadius: 35,
  friction: 0.99,
  maxScore: 7,
};
