import fs from 'fs';
let code = fs.readFileSync('src/components/Game.tsx', 'utf8');

code = code.replace("ctx.fillStyle = '#ffffff';", "ctx.fillStyle = '#b7ffb0';");

fs.writeFileSync('src/components/Game.tsx', code);
console.log("Success");
