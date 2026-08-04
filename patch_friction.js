import fs from 'fs';
let code = fs.readFileSync('src/game/Physics.ts', 'utf8');

code = code.replace("const frictionFactor = Math.pow(config.friction, dt * 120);", "const frictionFactor = Math.pow(config.friction, dt * 60);");

fs.writeFileSync('src/game/Physics.ts', code);
console.log("Success friction patch");
