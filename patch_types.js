import fs from 'fs';
let code = fs.readFileSync('src/types.ts', 'utf8');

code = code.replace('puckRadius: 24,', 'puckRadius: 28,');

fs.writeFileSync('src/types.ts', code);
console.log("Success");
