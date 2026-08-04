import fs from 'fs';
let code = fs.readFileSync('src/components/Game.tsx', 'utf8');

const target = `const maxDt = 1 / 120; // 120 steps per second for physics stability`;
const replacement = `const maxDt = 1 / 480; // 480 steps per second for high-speed collision accuracy (prevents center-crossing tunneling)`;

if (code.includes(target)) {
  fs.writeFileSync('src/components/Game.tsx', code.replace(target, replacement));
  console.log("Success");
} else {
  console.log("Target not found!");
}
