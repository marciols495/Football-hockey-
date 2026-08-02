import React from 'react';
import { motion } from 'motion/react';
import { useTeamStore } from '../lib/store';
import { ArrowLeft, Trophy, Medal, RotateCcw } from 'lucide-react';
import { NeonButton } from './NeonUI';

export function Ranking({ onBack }: { onBack: () => void }) {
  const { players, resetAllGoals } = useTeamStore();

  const sortedPlayers = [...players].sort((a, b) => b.goals - a.goals).slice(0, 10);

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-slate-950 text-white p-4 sm:p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-8 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 rounded-full bg-slate-900 hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight flex items-center gap-3">
            <Trophy className="text-amber-500 w-8 h-8 sm:w-10 sm:h-10" />
            Top 10 Marcadores
          </h1>
        </div>
        
        <button 
          onClick={() => {
            if (window.confirm('Tem certeza que deseja zerar os golos de todos os jogadores?')) {
              resetAllGoals();
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 rounded-xl font-bold transition-colors text-sm"
        >
          <RotateCcw size={16} />
          <span className="hidden sm:inline">Zerar Golos</span>
        </button>
      </div>

      <div className="w-full max-w-4xl mx-auto flex-1">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-800 bg-slate-950/50 font-bold text-slate-400 text-sm uppercase tracking-widest">
            <div className="col-span-2 sm:col-span-1 text-center">#</div>
            <div className="col-span-6 sm:col-span-7">Jogador</div>
            <div className="col-span-2 hidden sm:block text-center">Rating</div>
            <div className="col-span-4 sm:col-span-2 text-right pe-4">Golos</div>
          </div>
          
          <div className="flex flex-col">
            {sortedPlayers.map((player, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={player.id}
                className="grid grid-cols-12 gap-4 p-4 sm:p-6 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors items-center"
              >
                <div className="col-span-2 sm:col-span-1 flex justify-center">
                  {index === 0 ? <Medal className="text-yellow-400" /> :
                   index === 1 ? <Medal className="text-slate-300" /> :
                   index === 2 ? <Medal className="text-amber-700" /> :
                   <span className="text-slate-500 font-bold text-lg">{index + 1}</span>}
                </div>
                
                <div className="col-span-6 sm:col-span-7 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                  <span className="font-black text-lg sm:text-xl truncate">{player.name}</span>
                  <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 w-max">
                    {player.position}
                  </span>
                </div>
                
                <div className="col-span-2 hidden sm:flex justify-center">
                  <span className="font-black text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full">
                    {player.rating}
                  </span>
                </div>
                
                <div className="col-span-4 sm:col-span-2 text-right pe-4 flex items-center justify-end gap-2">
                  <span className="font-black text-2xl text-cyan-400">{player.goals}</span>
                  <span className="text-xs text-slate-500 font-bold uppercase hidden sm:block">Golos</span>
                </div>
              </motion.div>
            ))}
            
            {sortedPlayers.length === 0 && (
              <div className="p-12 text-center text-slate-500 font-bold">
                Nenhum jogador encontrado.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
