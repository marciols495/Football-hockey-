import fs from 'fs';
let code = fs.readFileSync('src/game/Physics.ts', 'utf8');

const targetCollision = `    if (p > 0) {
       c2.vel.x += p * c1.mass * nx;
       c2.vel.y += p * c1.mass * ny;
       // If getting crushed vertically, add lateral push to escape
       if (Math.abs(nx) < 0.1 && Math.abs(c2.vel.x) < 50) {
         c2.vel.x += (Math.random() > 0.5 ? 200 : -200);
       }
    } else {
       // If they overlap but aren't moving towards each other fast enough, give a small push based on overlap to prevent getting stuck
       c2.vel.x += nx * overlap * 10;
       c2.vel.y += ny * overlap * 10;
       // If perfectly stuck vertically, give a lateral push
       if (Math.abs(nx) < 0.1 && Math.abs(c2.vel.x) < 50) {
         c2.vel.x += (Math.random() > 0.5 ? 100 : -100);
       }
    }`;

const replacementCollision = `    if (p > 0) {
       c2.vel.x += p * c1.mass * nx;
       c2.vel.y += p * c1.mass * ny;
    }
    
    // Always apply anti-stuck logic when overlapping significantly or crushed
    if (overlap > 3 || Math.abs(c2.vel.y) < 100) {
       // The user requested to shoot the ball sideways when stuck
       // Give it a strong lateral velocity
       c2.vel.x += (c2.pos.x > config.width / 2 ? -800 : 800);
       // And a slight vertical push to get it out of the paddle
       c2.vel.y += (c2.pos.y > config.height / 2 ? -300 : 300);
    }`;

if (code.includes('if (p > 0) {') && code.includes('give a lateral push')) {
    code = code.replace(targetCollision, replacementCollision);
    fs.writeFileSync('src/game/Physics.ts', code);
    console.log("Success physics patch");
} else {
    console.log("Failed to find target block");
}
