import fs from 'fs';
let code = fs.readFileSync('src/components/Game.tsx', 'utf8');

const target = `        const runAILogic = (paddleId: 'p1' | 'p2', difficulty: 'easy' | 'medium' | 'hard' | number, isBottom: boolean) => {
          const aiPaddle = state.paddles[paddleId];
          const puck = state.puck;
          let maxSpeed = 400; // Medium
          if (typeof difficulty === 'number') {
             // Map rating (50-100) to speed (400-800) so they can still compete fairly
             maxSpeed = 400 + ((Math.max(50, Math.min(100, difficulty)) - 50) / 50) * 400;
          } else if (difficulty === 'easy') maxSpeed = 250;
          else if (difficulty === 'hard') maxSpeed = 750;
          
          let targetX = GAME_CONFIG.width / 2;
          let targetY = isBottom ? GAME_CONFIG.height * 0.75 : GAME_CONFIG.height / 4;

          const isPuckOnMySide = isBottom ? puck.pos.y > GAME_CONFIG.height / 2 - 30 : puck.pos.y < GAME_CONFIG.height / 2 + 30;

          if (isPuckOnMySide) {
            const isPuckTrapped = isBottom 
                ? puck.pos.y >= GAME_CONFIG.height - GAME_CONFIG.paddleRadius - GAME_CONFIG.puckRadius - 10
                : puck.pos.y <= GAME_CONFIG.paddleRadius + GAME_CONFIG.puckRadius + 10;
            const isPuckInGoalX = puck.pos.x > (GAME_CONFIG.width - GAME_CONFIG.goalWidth) / 2 && puck.pos.x < (GAME_CONFIG.width + GAME_CONFIG.goalWidth) / 2;
            
            if (isPuckTrapped && !isPuckInGoalX) {
               targetX = puck.pos.x > GAME_CONFIG.width / 2 ? puck.pos.x - 80 : puck.pos.x + 80;
               targetY = isBottom ? GAME_CONFIG.height - GAME_CONFIG.paddleRadius - 60 : GAME_CONFIG.paddleRadius + 60;
            } else {
               // Predict puck position slightly to avoid perfect straight lines
               targetX = puck.pos.x + (puck.vel.x * 0.15);
               
               // Add angular offset so they don't just shoot dead straight
               // If puck is on the left, hit its left side to send it right, etc.
               const aimOffset = (GAME_CONFIG.width / 2 - puck.pos.x) * 0.3;
               targetX -= aimOffset; 
               
               if (difficulty === 'easy' || (typeof difficulty === 'number' && difficulty < 70)) {
                  const errorMargin = typeof difficulty === 'number' ? (100 - difficulty) * 0.8 : 40;
                  targetX += Math.sin(time / 200) * errorMargin; 
               }

               // Aim slightly behind the puck to hit it towards the opponent
               targetY = isBottom ? Math.max(puck.pos.y + 15, GAME_CONFIG.height / 2 + 20) : Math.min(puck.pos.y - 15, GAME_CONFIG.height / 2 - 20);
            }
          } else {
             // Return to defense position, tracking the puck's X position lazily
             targetX = puck.pos.x;
             
             if (difficulty === 'easy' || (typeof difficulty === 'number' && difficulty < 80)) {
                const errorMargin = typeof difficulty === 'number' ? (100 - difficulty) * 0.5 : 30;
                targetX += Math.sin(time / 250) * errorMargin; 
             }
             
             targetY = isBottom ? GAME_CONFIG.height - GAME_CONFIG.paddleRadius - 30 : GAME_CONFIG.paddleRadius + 30; 
             
             // If puck is coming fast towards us, get ready
             if (isBottom ? puck.vel.y > 100 : puck.vel.y < -100) {
               targetX = Math.max(GAME_CONFIG.paddleRadius, Math.min(GAME_CONFIG.width - GAME_CONFIG.paddleRadius, targetX));
             }
          }
          
          // Clamp target X to screen
          targetX = Math.max(GAME_CONFIG.paddleRadius, Math.min(GAME_CONFIG.width - GAME_CONFIG.paddleRadius, targetX));

          const dx = targetX - aiPaddle.pos.x;
          const dy = targetY - aiPaddle.pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Add some steering behavior rather than rigid velocity setting
          if (dist > 5) {
            const desiredVx = (dx / dist) * maxSpeed;
            const desiredVy = (dy / dist) * maxSpeed;
            
            // Lerp velocity for smoother, more organic movement
            const steeringForce = 15; // Higher = more robotic, Lower = more floaty
            aiPaddle.vel.x += (desiredVx - aiPaddle.vel.x) * steeringForce * dt;
            aiPaddle.vel.y += (desiredVy - aiPaddle.vel.y) * steeringForce * dt;
          } else {
            // Apply some friction if close to target
            aiPaddle.vel.x *= 0.8;
            aiPaddle.vel.y *= 0.8;
          }

          aiPaddle.pos.x += aiPaddle.vel.x * dt;
          aiPaddle.pos.y += aiPaddle.vel.y * dt;
        };

        if (mode === 'ai') {
          runAILogic('p2', aiDifficulty, false);
        } else if (mode === 'ai_vs_ai') {
          const storePlayers = useTeamStore.getState().players;
          const p1Rating = storePlayers.find(p => p.id === ai1PlayerId)?.rating || 80;
          const p2Rating = storePlayers.find(p => p.id === ai2PlayerId)?.rating || 80;
          runAILogic('p1', p1Rating, true); 
          runAILogic('p2', p2Rating, false);
        }

        const maxDt = 1 / 120; // 120 steps per second for physics stability
        let remainingDt = dt;
        while (remainingDt > 0) {
          const step = Math.min(remainingDt, maxDt);
          updatePhysics(state, GAME_CONFIG, step);
          remainingDt -= step;
        }`;

const replacement = `        const runAILogic = (paddleId: 'p1' | 'p2', difficulty: 'easy' | 'medium' | 'hard' | number, isBottom: boolean, stepDt: number) => {
          const aiPaddle = state.paddles[paddleId];
          const puck = state.puck;
          let maxSpeed = 400; // Medium
          if (typeof difficulty === 'number') {
             // Map rating (50-100) to speed (400-800) so they can still compete fairly
             maxSpeed = 400 + ((Math.max(50, Math.min(100, difficulty)) - 50) / 50) * 400;
          } else if (difficulty === 'easy') maxSpeed = 250;
          else if (difficulty === 'hard') maxSpeed = 750;
          
          let targetX = GAME_CONFIG.width / 2;
          let targetY = isBottom ? GAME_CONFIG.height * 0.75 : GAME_CONFIG.height / 4;

          const isPuckOnMySide = isBottom ? puck.pos.y > GAME_CONFIG.height / 2 - 30 : puck.pos.y < GAME_CONFIG.height / 2 + 30;

          if (isPuckOnMySide) {
            const isPuckTrapped = isBottom 
                ? puck.pos.y >= GAME_CONFIG.height - GAME_CONFIG.paddleRadius - GAME_CONFIG.puckRadius - 10
                : puck.pos.y <= GAME_CONFIG.paddleRadius + GAME_CONFIG.puckRadius + 10;
            const isPuckInGoalX = puck.pos.x > (GAME_CONFIG.width - GAME_CONFIG.goalWidth) / 2 && puck.pos.x < (GAME_CONFIG.width + GAME_CONFIG.goalWidth) / 2;
            
            if (isPuckTrapped && !isPuckInGoalX) {
               targetX = puck.pos.x > GAME_CONFIG.width / 2 ? puck.pos.x - 80 : puck.pos.x + 80;
               targetY = isBottom ? GAME_CONFIG.height - GAME_CONFIG.paddleRadius - 60 : GAME_CONFIG.paddleRadius + 60;
            } else {
               // Predict puck position slightly to avoid perfect straight lines
               targetX = puck.pos.x + (puck.vel.x * 0.15);
               
               // Add angular offset so they don't just shoot dead straight
               // If puck is on the left, hit its left side to send it right, etc.
               // We increase the offset to make it bounce more often.
               const aimOffset = (GAME_CONFIG.width / 2 - puck.pos.x) * 0.5;
               targetX -= aimOffset; 
               
               if (difficulty === 'easy' || (typeof difficulty === 'number' && difficulty < 70)) {
                  const errorMargin = typeof difficulty === 'number' ? (100 - difficulty) * 0.8 : 40;
                  targetX += Math.sin(time / 200) * errorMargin; 
               }

               // Aim slightly behind the puck to hit it towards the opponent
               targetY = isBottom ? Math.max(puck.pos.y + 15, GAME_CONFIG.height / 2 + 20) : Math.min(puck.pos.y - 15, GAME_CONFIG.height / 2 - 20);
            }
          } else {
             // Return to defense position, tracking the puck's X position lazily
             targetX = puck.pos.x;
             
             if (difficulty === 'easy' || (typeof difficulty === 'number' && difficulty < 80)) {
                const errorMargin = typeof difficulty === 'number' ? (100 - difficulty) * 0.5 : 30;
                targetX += Math.sin(time / 250) * errorMargin; 
             }
             
             targetY = isBottom ? GAME_CONFIG.height - GAME_CONFIG.paddleRadius - 30 : GAME_CONFIG.paddleRadius + 30; 
             
             // If puck is coming fast towards us, get ready
             if (isBottom ? puck.vel.y > 100 : puck.vel.y < -100) {
               targetX = Math.max(GAME_CONFIG.paddleRadius, Math.min(GAME_CONFIG.width - GAME_CONFIG.paddleRadius, targetX));
             }
          }
          
          // Clamp target X to screen
          targetX = Math.max(GAME_CONFIG.paddleRadius, Math.min(GAME_CONFIG.width - GAME_CONFIG.paddleRadius, targetX));

          const dx = targetX - aiPaddle.pos.x;
          const dy = targetY - aiPaddle.pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Add some steering behavior rather than rigid velocity setting
          if (dist > 5) {
            const desiredVx = (dx / dist) * maxSpeed;
            const desiredVy = (dy / dist) * maxSpeed;
            
            // Lerp velocity for smoother, more organic movement
            const steeringForce = 20; // Higher = more robotic, Lower = more floaty
            aiPaddle.vel.x += (desiredVx - aiPaddle.vel.x) * steeringForce * stepDt;
            aiPaddle.vel.y += (desiredVy - aiPaddle.vel.y) * steeringForce * stepDt;
          } else {
            // Apply some friction if close to target
            aiPaddle.vel.x *= 0.8;
            aiPaddle.vel.y *= 0.8;
          }

          aiPaddle.pos.x += aiPaddle.vel.x * stepDt;
          aiPaddle.pos.y += aiPaddle.vel.y * stepDt;
        };

        const maxDt = 1 / 120; // 120 steps per second for physics stability
        let remainingDt = dt;
        while (remainingDt > 0) {
          const step = Math.min(remainingDt, maxDt);
          
          if (mode === 'ai') {
            runAILogic('p2', aiDifficulty, false, step);
          } else if (mode === 'ai_vs_ai') {
            const storePlayers = useTeamStore.getState().players;
            const p1Rating = storePlayers.find(p => p.id === ai1PlayerId)?.rating || 80;
            const p2Rating = storePlayers.find(p => p.id === ai2PlayerId)?.rating || 80;
            runAILogic('p1', p1Rating, true, step); 
            runAILogic('p2', p2Rating, false, step);
          }
          
          updatePhysics(state, GAME_CONFIG, step);
          remainingDt -= step;
        }`;

if (code.includes(target)) {
  fs.writeFileSync('src/components/Game.tsx', code.replace(target, replacement));
  console.log("Success");
} else {
  console.log("Target not found!");
}
