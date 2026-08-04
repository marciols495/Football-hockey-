import fs from 'fs';
let code = fs.readFileSync('src/components/Game.tsx', 'utf8');

const targetPaddle = `      if (name) {
         ctx.font = 'bold 12px "Space Grotesk", sans-serif';
         ctx.fillStyle = '#a0ff94'; // Luminous green core
    ctx.shadowColor = '#39ff14';
    ctx.shadowBlur = 30;

         ctx.textAlign = 'center';
         ctx.textBaseline = 'middle';
         ctx.fillText(name.substring(0, 3).toUpperCase(), p.pos.x, p.pos.y);
      }
    };`;

const replacementPaddle = `      if (name) {
         ctx.font = 'bold 12px "Space Grotesk", sans-serif';
         ctx.fillStyle = color;
         ctx.textAlign = 'center';
         ctx.textBaseline = 'middle';
         ctx.fillText(name.substring(0, 3).toUpperCase(), p.pos.x, p.pos.y);
      }
    };`;

code = code.replace(targetPaddle, replacementPaddle);
fs.writeFileSync('src/components/Game.tsx', code);
console.log("Success rendering patch");
