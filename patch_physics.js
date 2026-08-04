import fs from 'fs';
let code = fs.readFileSync('src/game/Physics.ts', 'utf8');

const targetFriction = `  puck.vel.x *= config.friction;
  puck.vel.y *= config.friction;`;

const replacementFriction = `  const frictionFactor = Math.pow(config.friction, dt * 120);
  puck.vel.x *= frictionFactor;
  puck.vel.y *= frictionFactor;`;

code = code.replace(targetFriction, replacementFriction);

const targetCollision = `       c2.vel.x += nx * overlap * 10;
       c2.vel.y += ny * overlap * 10;`;

const replacementCollision = `       c2.vel.x += nx * overlap * 10;
       c2.vel.y += ny * overlap * 10;
       // If perfectly stuck vertically, give a lateral push
       if (Math.abs(nx) < 0.1 && Math.abs(c2.vel.x) < 50) {
         c2.vel.x += (Math.random() > 0.5 ? 100 : -100);
       }`;

code = code.replace(targetCollision, replacementCollision);

fs.writeFileSync('src/game/Physics.ts', code);
console.log("Success");
