import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTeamStore, Player, Position } from '../lib/store';
import { ArrowLeft, Plus, X, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

const INITIALS_COLORS = ['bg-blue-500', 'bg-emerald-500', 'bg-pink-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500'];

const getSpecificPosition = (pos: Position, x: number, y: number) => {
  if (pos === 'GOL') return 'GR';
  if (pos === 'DEF') {
    if (x < 0.35) return 'DE';
    if (x > 0.65) return 'DD';
    return 'DC';
  }
  if (pos === 'LAT') {
    if (x < 0.5) return 'DE';
    return 'DD';
  }
  if (pos === 'MED') {
    if (x < 0.35) return 'ME';
    if (x > 0.65) return 'MD';
    return 'MC';
  }
  if (pos === 'ATA') {
    if (x < 0.35) return 'EE';
    if (x > 0.65) return 'ED';
    return 'PL';
  }
  return pos;
};

const getCardStyle = (rating: number) => {
  if (rating >= 85) return 'bg-gradient-to-b from-[#FFA700] to-[#FF8C00] text-[#1A1A1A] border-[#FFB84C]';
  if (rating >= 79) return 'bg-gradient-to-b from-[#5C85FF] to-[#3A52FF] text-white border-[#6A90FF]';
  return 'bg-gradient-to-b from-[#C4C4C4] to-[#A0A0A0] text-[#1A1A1A] border-[#D0D0D0]';
};

const getInitialsColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % INITIALS_COLORS.length;
  return INITIALS_COLORS[index];
};

export function Tactics({ onBack }: { onBack: () => void }) {
  const { players, activePlayerId, setActivePlayer, updatePlayer, addPlayer, removePlayer, resetPlayerGoals } = useTeamStore();
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showManageTactics, setShowManageTactics] = useState(false);

  const pitchRef = useRef<HTMLDivElement>(null);

  const handlePlayerClick = (player: Player) => {
    setEditingPlayer(player);
  };

  const handleDragEnd = (player: Player, event: any, info: any) => {
    const pitchRect = pitchRef.current?.getBoundingClientRect();
    if (!pitchRect) return;

    if (
      info.point.x >= pitchRect.left &&
      info.point.x <= pitchRect.right &&
      info.point.y >= pitchRect.top &&
      info.point.y <= pitchRect.bottom
    ) {
      let newX = (info.point.x - pitchRect.left) / pitchRect.width;
      let newY = (info.point.y - pitchRect.top) / pitchRect.height;
      newX = Math.max(0, Math.min(1, newX));
      newY = Math.max(0, Math.min(1, newY));
      updatePlayer(player.id, { pitchX: newX, pitchY: newY, isOnPitch: true });
    } else {
      updatePlayer(player.id, { isOnPitch: false });
    }
  };

  const pitchPlayers = players.filter(p => p.isOnPitch !== false);
  const benchPlayers = players.filter(p => p.isOnPitch === false);

  const applyFormation = (name: string) => {
     const formationPlayers = [...players].sort((a,b) => {
        if(a.position === 'GOL') return -1;
        if(b.position === 'GOL') return 1;
        return 0;
     }).slice(0, 11);

     players.forEach(p => updatePlayer(p.id, { isOnPitch: false }));

     let positions = [];
     if (name === '4-3-3') {
        positions = [
           {x: 0.5, y: 0.9}, 
           {x: 0.2, y: 0.75}, {x: 0.4, y: 0.75}, {x: 0.6, y: 0.75}, {x: 0.8, y: 0.75},
           {x: 0.25, y: 0.5}, {x: 0.5, y: 0.5}, {x: 0.75, y: 0.5}, 
           {x: 0.2, y: 0.25}, {x: 0.5, y: 0.15}, {x: 0.8, y: 0.25}  
        ];
     } else if (name === '3-4-3') {
        positions = [
           {x: 0.5, y: 0.9}, 
           {x: 0.3, y: 0.75}, {x: 0.5, y: 0.75}, {x: 0.7, y: 0.75}, 
           {x: 0.15, y: 0.5}, {x: 0.4, y: 0.5}, {x: 0.6, y: 0.5}, {x: 0.85, y: 0.5}, 
           {x: 0.2, y: 0.25}, {x: 0.5, y: 0.15}, {x: 0.8, y: 0.25}  
        ];
     } else if (name === '4-2-3-1') {
        positions = [
           {x: 0.5, y: 0.9}, 
           {x: 0.2, y: 0.8}, {x: 0.4, y: 0.8}, {x: 0.6, y: 0.8}, {x: 0.8, y: 0.8}, 
           {x: 0.35, y: 0.6}, {x: 0.65, y: 0.6}, 
           {x: 0.2, y: 0.4}, {x: 0.5, y: 0.4}, {x: 0.8, y: 0.4}, 
           {x: 0.5, y: 0.15} 
        ];
     } else if (name === '4-4-2') {
        positions = [
           {x: 0.5, y: 0.9}, 
           {x: 0.2, y: 0.75}, {x: 0.4, y: 0.75}, {x: 0.6, y: 0.75}, {x: 0.8, y: 0.75}, 
           {x: 0.2, y: 0.5}, {x: 0.4, y: 0.5}, {x: 0.6, y: 0.5}, {x: 0.8, y: 0.5}, 
           {x: 0.35, y: 0.2}, {x: 0.65, y: 0.2} 
        ];
     }

     formationPlayers.forEach((p, idx) => {
        if (positions[idx]) {
           updatePlayer(p.id, { isOnPitch: true, pitchX: positions[idx].x, pitchY: positions[idx].y });
        }
     });
  };

  const renderPlayerCard = (player: Player, inBench = false) => {
    const isSelected = activePlayerId === player.id;
    const cardStyle = getCardStyle(player.rating);
    const initialsColor = getInitialsColor(player.name);
    const specificPos = getSpecificPosition(player.position, player.pitchX ?? 0.5, player.pitchY ?? 0.5);

    return (
      <motion.div
        key={player.id}
        drag
        dragMomentum={false}
        onDragEnd={(e, info) => handleDragEnd(player, e, info)}
        whileHover={{ scale: 1.05, zIndex: 50 }}
        whileTap={{ scale: 0.95, zIndex: 50 }}
        className={cn(
          "cursor-grab active:cursor-grabbing flex flex-col items-center gap-1 z-10 touch-none",
          !inBench && "absolute transform -translate-x-1/2 -translate-y-1/2"
        )}
        style={!inBench ? {
          left: `${(player.pitchX ?? 0.5) * 100}%`,
          top: `${(player.pitchY ?? 0.5) * 100}%`,
        } : {}}
      >
        <div 
          onClick={() => handlePlayerClick(player)}
          className={cn(
          "w-14 h-20 sm:w-16 sm:h-24 rounded-2xl flex flex-col items-center p-1 sm:p-1.5 shadow-xl relative overflow-hidden transition-all duration-300 border",
          cardStyle,
          isSelected && 'ring-4 ring-white ring-offset-2 ring-offset-[#2F8F32]'
        )}>
          {/* Top row */}
          <div className="w-full flex justify-between items-start px-0.5">
            <div className="flex flex-col items-start leading-none">
              <span className="text-xs sm:text-base font-black tracking-tighter leading-none">{player.rating}</span>
              <span className="text-[7px] sm:text-[9px] font-bold opacity-80 uppercase leading-none mt-0.5">{player.position}</span>
            </div>
            <Zap size={10} className="w-3 h-3 sm:w-4 sm:h-4 opacity-60 text-yellow-300 fill-yellow-300" />
          </div>
          
          {/* Portrait Circle */}
          <div className={cn(
            "w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black text-white mt-1 sm:mt-1.5 mb-1 border-2 border-white/20 shadow-inner",
            initialsColor
          )}>
            {player.name.substring(0, 2).toUpperCase()}
          </div>
          
          {/* Name */}
          <div className="w-full text-center truncate px-1 mt-auto pb-0.5 font-bold text-[8px] sm:text-[10px] leading-tight">
            {player.name}
          </div>
        </div>
        
        {/* Specific Position Pill */}
        <div className="bg-slate-950 text-white px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black border border-slate-700 shadow-lg tracking-widest min-w-[32px] text-center">
          {inBench ? player.position : specificPos}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-[#1A1A1A] text-white p-4 overflow-hidden h-full">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Tática eFootball</h1>
        <div className="flex items-center gap-3">
          <button 
             onClick={() => players.forEach(p => updatePlayer(p.id, { isOnPitch: false }))}
             className="px-5 py-2 bg-[#2A2A2A] hover:bg-[#333] text-white rounded-full font-bold text-sm transition-colors border border-[#333]"
          >
            Limpar
          </button>
          <button className="px-5 py-2 bg-[#8CFF5A] hover:bg-[#7AE04E] text-[#1A1A1A] rounded-full font-bold text-sm transition-colors">
            Guardar Equipa
          </button>
        </div>
      </div>

      {/* Formations Bar */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
        {['4-3-3', '3-4-3', '4-2-3-1', '4-4-2'].map((tactic, i) => (
          <button 
            key={tactic}
            onClick={() => applyFormation(tactic)}
            className={cn(
              "px-6 py-2 rounded-full font-bold text-sm transition-colors whitespace-nowrap",
              i === 0 ? "bg-white text-[#2F8F32]" : "bg-[#2A2A2A] hover:bg-[#333] text-[#999]"
            )}
          >
            {tactic}
          </button>
        ))}
      </div>
      <div className="mb-4">
        <button 
          onClick={() => setShowManageTactics(true)}
          className="px-5 py-2 border border-[#444] text-[#CCC] hover:bg-[#2A2A2A] rounded-full font-bold text-sm transition-colors whitespace-nowrap"
        >
          Gerir Táticas
        </button>
      </div>

      {/* Main Pitch Area */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 relative w-full pt-2 pb-2">
        <div 
          ref={pitchRef}
          className="w-full h-full max-w-4xl relative rounded-xl border-[6px] border-[#E5E5E5] bg-[#2F8F32] overflow-hidden shadow-2xl shrink-0" 
        >
          {/* Pitch Lines */}
          <div className="absolute inset-0 pointer-events-none opacity-80">
              {/* Outer boundary offset */}
              <div className="absolute inset-2 border-[2px] border-white pointer-events-none"></div>

              {/* Center line */}
              <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white transform -translate-y-1/2"></div>
              {/* Center circle */}
              <div className="absolute top-1/2 left-1/2 w-1/4 aspect-square border-[2px] border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
              
              {/* Top Penalty area */}
              <div className="absolute top-2 left-1/2 w-1/2 h-[20%] border-[2px] border-white border-t-0 transform -translate-x-1/2"></div>
              <div className="absolute top-2 left-1/2 w-[20%] h-[10%] border-[2px] border-white border-t-0 transform -translate-x-1/2"></div>
              <div className="absolute top-[22%] left-1/2 w-[15%] h-[10%] border-[2px] border-white border-t-0 rounded-b-full transform -translate-x-1/2"></div>

              {/* Bottom Penalty area */}
              <div className="absolute bottom-2 left-1/2 w-1/2 h-[20%] border-[2px] border-white border-b-0 transform -translate-x-1/2"></div>
              <div className="absolute bottom-2 left-1/2 w-[20%] h-[10%] border-[2px] border-white border-b-0 transform -translate-x-1/2"></div>
              <div className="absolute bottom-[22%] left-1/2 w-[15%] h-[10%] border-[2px] border-white border-b-0 rounded-t-full transform -translate-x-1/2"></div>
          </div>

          {/* Players on Pitch */}
          {pitchPlayers.map((player) => renderPlayerCard(player, false))}
        </div>
      </div>

      {/* Bench Area */}
      <div className="mt-4 pt-4 border-t border-[#333] shrink-0">
         <div className="flex items-center justify-between text-[#888] text-xs font-bold uppercase tracking-widest mb-4 px-2">
            <span>Banco • {benchPlayers.length}</span>
            <span>arrasta para o campo &rarr;</span>
         </div>
         <div className="flex gap-4 overflow-x-auto pb-4 px-2 min-h-[140px] items-start">
            {benchPlayers.map(player => renderPlayerCard(player, true))}
            
            <button 
              onClick={() => setIsCreating(true)}
              className="w-14 h-20 sm:w-16 sm:h-24 rounded-2xl border-2 border-dashed border-[#444] hover:border-[#666] flex flex-col items-center justify-center text-[#666] hover:text-[#999] transition-colors shrink-0"
            >
              <Plus size={24} className="mb-2" />
              <span className="text-[10px] font-bold">NOVO +</span>
            </button>
         </div>
      </div>

      <AnimatePresence>
        {(editingPlayer || isCreating) && (
          <PlayerEditModal
            player={editingPlayer}
            isCreating={isCreating}
            onClose={() => { setEditingPlayer(null); setIsCreating(false); }}
            onSave={(updatedPlayer) => {
              if (isCreating) {
                addPlayer({
                  ...updatedPlayer,
                  isOnPitch: false
                } as any);
              } else if (editingPlayer) {
                updatePlayer(editingPlayer.id, updatedPlayer);
              }
              setEditingPlayer(null);
              setIsCreating(false);
            }}
            onDelete={(id) => {
              removePlayer(id);
              setEditingPlayer(null);
              setIsCreating(false);
            }}
            onSelect={(id) => {
              setActivePlayer(id);
            }}
            onResetGoals={resetPlayerGoals}
            isActive={activePlayerId === editingPlayer?.id}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showManageTactics && (
          <ManageTacticsModal onClose={() => setShowManageTactics(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function ManageTacticsModal({ onClose }: { onClose: () => void }) {
   return (
      <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         exit={{ opacity: 0 }}
         className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center p-0 sm:p-4"
      >
         <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="w-full sm:max-w-md bg-[#111] rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[90vh]"
         >
            <div className="w-12 h-1 bg-[#333] rounded-full mx-auto my-3 sm:hidden" />
            <div className="flex items-center justify-between p-6 pb-4">
               <h2 className="text-2xl font-bold text-white">Gerir Táticas</h2>
               <button onClick={onClose} className="p-2 border border-[#333] rounded-full text-[#999] hover:text-white transition-colors">
                  <X size={20} />
               </button>
            </div>
            
            <div className="px-6 pb-6 overflow-y-auto">
               <div className="flex items-center gap-3 mb-6 bg-[#222] p-1.5 rounded-xl border border-[#333]">
                  <input 
                     type="text" 
                     placeholder="Nome da nova tática" 
                     className="flex-1 bg-transparent border-none text-[#999] font-bold px-4 py-2 focus:outline-none"
                  />
                  <button className="px-4 py-2 bg-[#444] rounded-lg font-bold text-sm text-[#CCC]">
                     Nova Tática
                  </button>
               </div>

               <div className="space-y-4">
                  <div className="bg-[#222] p-4 rounded-xl border border-[#333]">
                     <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                           <span className="font-bold text-lg text-white">4-3-3</span>
                           <span className="px-2 py-0.5 text-[10px] font-bold bg-[#333] text-[#999] rounded">BASE</span>
                           <span className="px-2 py-0.5 text-[10px] font-bold bg-[#8CFF5A] text-[#1A1A1A] rounded">ATIVA</span>
                        </div>
                        <span className="text-xs text-[#666] font-bold">11 pos</span>
                     </div>
                     <div className="flex gap-2">
                        <button className="flex-1 py-2 bg-[#333] rounded-lg text-xs font-bold text-white transition-colors">Renomear</button>
                        <button className="flex-1 py-2 bg-[#333] rounded-lg text-xs font-bold text-white transition-colors">Duplicar</button>
                        <button className="flex-1 py-2 bg-[#333]/50 text-red-500/30 rounded-lg text-xs font-bold cursor-not-allowed">Apagar</button>
                        <button className="flex-[1.5] py-2 border border-[#2F8F32] text-[#8CFF5A] hover:bg-[#2F8F32]/20 rounded-lg text-xs font-bold transition-colors">Editar Posições</button>
                     </div>
                  </div>

                  <div className="bg-[#222] p-4 rounded-xl border border-[#333]">
                     <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                           <span className="font-bold text-lg text-white">3-4-3</span>
                           <span className="px-2 py-0.5 text-[10px] font-bold bg-[#333] text-[#999] rounded">BASE</span>
                        </div>
                        <span className="text-xs text-[#666] font-bold">11 pos</span>
                     </div>
                     <div className="flex gap-2">
                        <button className="flex-1 py-2 bg-[#333] rounded-lg text-xs font-bold text-white transition-colors">Renomear</button>
                        <button className="flex-1 py-2 bg-[#333] rounded-lg text-xs font-bold text-white transition-colors">Duplicar</button>
                        <button className="flex-1 py-2 bg-[#3A1111] text-red-500 border border-red-900/50 rounded-lg text-xs font-bold transition-colors">Apagar</button>
                        <button className="flex-[1.5] py-2 border border-[#2F8F32] text-[#8CFF5A] hover:bg-[#2F8F32]/20 rounded-lg text-xs font-bold transition-colors">Editar Posições</button>
                     </div>
                  </div>
               </div>
            </div>

            <div className="p-6 pt-2">
               <button onClick={onClose} className="w-full py-4 bg-[#2A2A2A] text-white hover:bg-[#333] rounded-xl font-bold transition-colors">
                  Fechar
               </button>
            </div>
         </motion.div>
      </motion.div>
   )
}

function PlayerEditModal({ 
  player, 
  isCreating, 
  onClose, 
  onSave, 
  onDelete,
  onSelect,
  onResetGoals,
  isActive 
}: { 
  player: Player | null, 
  isCreating: boolean,
  onClose: () => void, 
  onSave: (player: Partial<Player>) => void,
  onDelete: (id: string) => void,
  onSelect: (id: string) => void,
  onResetGoals: (id: string) => void,
  isActive: boolean
}) {
  const [name, setName] = useState(player?.name || '');
  const [position, setPosition] = useState<Position>(player?.position || 'MED');
  const [rating, setRating] = useState(player?.rating || 80);

  const positions: Position[] = ['GOL', 'DEF', 'LAT', 'MED', 'ATA'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-[#1A1A1A] border border-[#333] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-[#333] flex items-center justify-between">
          <h3 className="text-2xl font-black">{isCreating ? 'Novo Jogador' : 'Editar Jogador'}</h3>
          <button onClick={onClose} className="p-2 bg-[#2A2A2A] hover:bg-[#333] rounded-full transition-colors text-[#999] hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#666] uppercase tracking-widest">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0D0D0D] border border-[#333] rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-[#8CFF5A] transition-colors"
              placeholder="Nome do jogador"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[#666] uppercase tracking-widest">Posição</label>
            <div className="grid grid-cols-5 gap-1 sm:gap-2">
              {positions.map((pos) => (
                <button
                  key={pos}
                  onClick={() => setPosition(pos)}
                  className={cn(
                    "py-2 rounded-lg font-bold text-[10px] sm:text-sm transition-all border",
                    position === pos 
                      ? "bg-white text-[#1A1A1A] border-white" 
                      : "bg-[#0D0D0D] border-[#333] text-[#999] hover:bg-[#2A2A2A]"
                  )}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-[#666] uppercase tracking-widest">Rating</label>
              <span className="text-xl font-black text-amber-500">{rating}</span>
            </div>
            <input
              type="range"
              min="60"
              max="99"
              value={rating}
              onChange={(e) => setRating(parseInt(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          {!isCreating && player && (
            <div className="flex items-center justify-between p-4 bg-[#0D0D0D] rounded-xl border border-[#333]">
              <span className="text-sm font-bold text-[#999]">Golos na Carreira</span>
              <div className="flex items-center gap-4">
                <span className="text-xl font-black text-cyan-400">{player.goals}</span>
                <button 
                  onClick={() => {
                    if (window.confirm('Tem certeza que deseja zerar os golos deste jogador?')) {
                      onResetGoals(player.id);
                    }
                  }}
                  className="px-2 py-1 rounded bg-[#2A2A2A] hover:bg-[#333] text-xs font-bold text-[#999] hover:text-white transition-colors"
                >
                  Zerar
                </button>
              </div>
            </div>
          )}

          <div className="pt-4 grid grid-cols-2 gap-4">
            <button 
              onClick={onClose}
              className="py-3 rounded-xl font-bold bg-[#2A2A2A] text-[#CCC] hover:bg-[#333] transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={() => onSave({ name, position, rating })}
              className="py-3 rounded-xl font-black bg-[#8CFF5A] text-[#1A1A1A] hover:bg-[#7AE04E] transition-colors"
            >
              Guardar
            </button>
          </div>
          
          {!isCreating && player && (
            <div className="pt-2 flex flex-col gap-3">
               <button
                 onClick={() => {
                   onSelect(player.id);
                   onClose();
                 }}
                 className={cn(
                   "w-full py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2",
                   isActive ? "bg-cyan-500 text-slate-950 pointer-events-none" : "bg-[#2A2A2A] hover:bg-[#333] text-white"
                 )}
               >
                 {isActive ? 'Selecionado para Jogar' : 'Selecionar para Jogar'}
               </button>

              <button 
                onClick={() => onDelete(player.id)}
                className="w-full py-3 rounded-xl font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-colors"
              >
                Remover Jogador
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
