import fs from 'fs';
let code = fs.readFileSync('src/game/Physics.ts', 'utf8');

const targetCollision = `    if (p > 0) {
       c2.vel.x += p * c1.mass * nx;
       c2.vel.y += p * c1.mass * ny;
    } else {`;

const replacementCollision = `    if (p > 0) {
       c2.vel.x += p * c1.mass * nx;
       c2.vel.y += p * c1.mass * ny;
       // If getting crushed vertically, add lateral push to escape
       if (Math.abs(nx) < 0.1 && Math.abs(c2.vel.x) < 50) {
         c2.vel.x += (Math.random() > 0.5 ? 200 : -200);
       }
    } else {`;

code = code.replace(targetCollision, replacementCollision);
fs.writeFileSync('src/game/Physics.ts', code);
console.log("Success");
