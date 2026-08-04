import fs from 'fs';
let code = fs.readFileSync('src/components/Game.tsx', 'utf8');

const target = `             const offset = (GAME_CONFIG.width / 2 - puck.pos.x) * 0.8;
             targetX -= offset;`;

const replacement = `             const maxOffset = 20; 
             let offset = (GAME_CONFIG.width / 2 - puck.pos.x) * 0.5;
             offset = Math.max(-maxOffset, Math.min(maxOffset, offset));
             targetX -= offset;`;

if (code.includes(target)) {
  fs.writeFileSync('src/components/Game.tsx', code.replace(target, replacement));
  console.log("Success");
} else {
  console.log("Target not found!");
}
