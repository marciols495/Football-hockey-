import fs from 'fs';
let code = fs.readFileSync('src/game/Physics.ts', 'utf8');

const targetCollision = `    // Always apply anti-stuck logic when overlapping significantly or crushed
    if (overlap > 3 || Math.abs(c2.vel.y) < 100) {
       // The user requested to shoot the ball sideways when stuck
       // Give it a strong lateral velocity
       c2.vel.x += (c2.pos.x > config.width / 2 ? -800 : 800);
       // And a slight vertical push to get it out of the paddle
       c2.vel.y += (c2.pos.y > config.height / 2 ? -300 : 300);
    }`;

const replacementCollision = `    // Anti-stuck logic: If heavily overlapped or completely dead inside the paddle
    const currentSpeed = Math.sqrt(c2.vel.x ** 2 + c2.vel.y ** 2);
    if (overlap > 8 || (overlap > 2 && currentSpeed < 100)) {
       // The user requested to shoot the ball sideways when stuck
       c2.vel.x = (c2.pos.x > config.width / 2 ? -800 : 800);
       c2.vel.y = (c2.pos.y > config.height / 2 ? -300 : 300);
    }`;

code = code.replace(targetCollision, replacementCollision);
fs.writeFileSync('src/game/Physics.ts', code);
console.log("Success physics patch 3");
