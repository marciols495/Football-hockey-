import fs from 'fs';
let code = fs.readFileSync('src/components/Game.tsx', 'utf8');

code = code.replace("const maxDt = 1 / 480;", "const maxDt = 1 / 60; // 60 steps max to prevent latency death spiral");
code = code.replace("const maxDt = 1 / 120;", "const maxDt = 1 / 60;");

fs.writeFileSync('src/components/Game.tsx', code);
console.log("Success dt patch");
