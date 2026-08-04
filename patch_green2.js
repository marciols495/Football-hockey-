import fs from 'fs';
let code = fs.readFileSync('src/components/Game.tsx', 'utf8');

code = code.replace("ctx.fillStyle = '#b7ffb0';", "ctx.fillStyle = '#a0ff94'; // Luminous green core\n    ctx.shadowColor = '#39ff14';\n    ctx.shadowBlur = 30;\n");

fs.writeFileSync('src/components/Game.tsx', code);
console.log("Success");
