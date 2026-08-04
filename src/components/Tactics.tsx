import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTeamStore, Player, Position, Group } from '../lib/store';
import { ArrowLeft, Plus, X, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

const INITIALS_COLORS = ['bg-blue-500', 'bg-emerald-500', 'bg-pink-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500'];

const getSpecificPosition = (pos: Position, x: number, y: number) => {
  return pos;
};

const getCardStyle = (rating: number) => {
  if (rating >= 90) return 'bg-gradient-to-b from-[#E0E0E0] to-[#A0A0A0] text-[#1A1A1A] border-[#F0F0F0]';
  if (rating >= 80) return 'bg-gradient-to-b from-[#FFA700] to-[#FF8C00] text-[#1A1A1A] border-[#FFB84C]';
  return 'bg-gradient-to-b from-[#5C85FF] to-[#3A52FF] text-white border-[#6A90FF]';
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
  const { 
    groups, 
    activeGroupId, 
    players, 
    activePlayerId, 
    addGroup, 
    removeGroup, 
    setActiveGroup, 
    setActivePlayer, 
    updatePlayer, 
    addPlayer, 
    removePlayer, 
    resetPlayerPoints 
  } = useTeamStore();
  
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isCreating, setIsCreating] = useState(false);

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

  const groupPlayers = players.filter(p => p.groupId === activeGroupId);
  const pitchPlayers = groupPlayers.filter(p => p.isOnPitch !== false);
  const benchPlayers = groupPlayers.filter(p => p.isOnPitch === false);

  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const activeGroup = groups.find(g => g.id === activeGroupId) || groups[0];

  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      addGroup(newGroupName.trim());
      setNewGroupName('');
      setIsCreatingGroup(false);
    }
  };

  const handleRemoveGroup = () => {
    if (window.confirm(`Tem certeza que deseja apagar o grupo "${activeGroup.name}" e todos os seus animais?`)) {
      removeGroup(activeGroupId);
    }
  };

  const renderPlayerCard = (player: Player, inBench = false) => {
    const isSelected = activePlayerId === player.id;
    const cardStyle = getCardStyle(player.rating);
    const initialsColor = getInitialsColor(player.name);
    
    // Convert full position name to acronym for the card view to save space
    let shortPos = player.position.substring(0, 3).toUpperCase();

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
          isSelected && 'ring-4 ring-cyan-400 ring-offset-2 ring-offset-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.6)]'
        )}>
          {/* Top row */}
          <div className="w-full flex justify-between items-start px-0.5">
            <div className="flex flex-col items-start leading-none">
              <span className="text-xs sm:text-base font-black tracking-tighter leading-none">{player.rating}</span>
              <span className="text-[7px] sm:text-[9px] font-bold opacity-80 uppercase leading-none mt-0.5">{shortPos}</span>
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
          {player.position}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-[#1A1A1A] text-white p-4 overflow-hidden h-full">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-2 sm:p-2.5 rounded-full bg-[#2A2A2A] hover:bg-[#333] transition-colors shrink-0">
            <ArrowLeft size={20} className="sm:hidden" />
            <ArrowLeft size={24} className="hidden sm:block" />
          </button>
          
          <div className="flex flex-wrap items-center gap-2">
            <select 
              value={activeGroupId} 
              onChange={(e) => setActiveGroup(e.target.value)}
              className="bg-[#2A2A2A] text-white border border-[#333] rounded-lg px-3 py-1.5 font-bold text-sm sm:text-base focus:outline-none focus:border-[#8CFF5A]"
            >
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            <button 
              onClick={() => setIsCreatingGroup(true)}
              className="px-3 py-1.5 rounded-lg bg-[#2A2A2A] hover:bg-[#333] flex items-center justify-center border border-[#333] text-white transition-colors text-sm font-bold shadow-sm"
              title="Novo Grupo"
            >
              <Plus size={16} className="mr-1" /> Criar Grupo
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 self-end sm:self-auto">
          <button 
             onClick={() => groupPlayers.forEach(p => updatePlayer(p.id, { isOnPitch: false }))}
             className="px-3 py-1.5 sm:px-5 sm:py-2 bg-[#2A2A2A] hover:bg-[#333] text-white rounded-full font-bold text-xs sm:text-sm transition-colors border border-[#333]"
          >
            Limpar Arena
          </button>
        </div>
      </div>

      {/* Main Arena Area */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 relative w-full pt-2 pb-2">
        <div 
          ref={pitchRef}
          className="w-full h-full max-w-4xl relative rounded-xl border-[6px] border-cyan-500 bg-slate-950 overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.4)] shrink-0" 
          style={{
            backgroundImage: 'radial-gradient(circle at center, rgba(6,182,212,0.15) 0%, rgba(2,6,23,1) 100%), repeating-linear-gradient(45deg, rgba(6,182,212,0.05) 0px, rgba(6,182,212,0.05) 20px, transparent 20px, transparent 40px)'
          }}
        >
          {/* Inner Arena decoration */}
          <div className="absolute inset-4 border-[2px] border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.3)_inset] rounded-full pointer-events-none"></div>
          <div className="absolute top-1/2 left-1/2 w-1/3 aspect-square border-[2px] border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.4)] rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

          {/* Players in Arena */}
          {pitchPlayers.map((player) => renderPlayerCard(player, false))}
        </div>
      </div>

      {/* Bench Area */}
      <div className="mt-4 pt-4 border-t border-[#333] shrink-0">
         <div className="flex items-center justify-between text-[#888] text-xs font-bold uppercase tracking-widest mb-4 px-2">
            <span>Reserva / Incubadora • {benchPlayers.length}</span>
            <span>arrasta para a arena &rarr;</span>
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
            groups={groups}
            activeGroupId={activeGroupId}
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
            onResetPoints={resetPlayerPoints}
            isActive={activePlayerId === editingPlayer?.id}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCreatingGroup && (
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
                <h3 className="text-2xl font-black">Novo Grupo</h3>
                <button onClick={() => setIsCreatingGroup(false)} className="p-2 bg-[#2A2A2A] hover:bg-[#333] rounded-full transition-colors text-[#999] hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#666] uppercase tracking-widest">Nome do Grupo</label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full bg-[#0D0D0D] border border-[#333] rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-[#8CFF5A] transition-colors"
                    placeholder="Ex: Predadores"
                    autoFocus
                  />
                </div>
                <div className="pt-4 grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setIsCreatingGroup(false)}
                    className="py-3 rounded-xl font-bold bg-[#2A2A2A] text-[#CCC] hover:bg-[#333] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleAddGroup}
                    className="py-3 rounded-xl font-black bg-[#8CFF5A] text-[#1A1A1A] hover:bg-[#7AE04E] transition-colors"
                  >
                    Criar Grupo
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PlayerEditModal({ 
  player, 
  isCreating,
  groups,
  activeGroupId,
  onClose, 
  onSave, 
  onDelete,
  onSelect,
  onResetPoints,
  isActive 
}: { 
  player: Player | null, 
  isCreating: boolean,
  groups: Group[],
  activeGroupId: string,
  onClose: () => void, 
  onSave: (player: Partial<Player>) => void,
  onDelete: (id: string) => void,
  onSelect: (id: string) => void,
  onResetPoints: (id: string) => void,
  isActive: boolean
}) {
  const [name, setName] = useState(player?.name || '');
  const [position, setPosition] = useState<Position>(player?.position || 'DINOSSAURO');
  const [rating, setRating] = useState(player?.rating || 80);
  const [groupId, setGroupId] = useState(player?.groupId || activeGroupId);

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
          <h3 className="text-2xl font-black">{isCreating ? 'Novo Animal' : 'Editar Animal'}</h3>
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
              placeholder="Nome do animal"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[#666] uppercase tracking-widest">Espécie / Família</label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full bg-[#0D0D0D] border border-[#333] rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-[#8CFF5A] transition-colors"
              placeholder="Ex: Canino, Felino, Dinossauro"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[#666] uppercase tracking-widest">Grupo</label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full bg-[#0D0D0D] border border-[#333] rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-[#8CFF5A] transition-colors"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-[#666] uppercase tracking-widest">Rating (Força)</label>
              <span className="text-xl font-black text-amber-500">{rating}</span>
            </div>
            <input
              type="range"
              min="50"
              max="99"
              value={rating}
              onChange={(e) => setRating(parseInt(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          {!isCreating && player && (
            <div className="flex items-center justify-between p-4 bg-[#0D0D0D] rounded-xl border border-[#333]">
              <span className="text-sm font-bold text-[#999]">Pontos / Vitórias</span>
              <div className="flex items-center gap-4">
                <span className="text-xl font-black text-cyan-400">{player.points}</span>
                <button 
                  onClick={() => {
                    if (window.confirm('Tem certeza que deseja zerar os pontos deste animal?')) {
                      onResetPoints(player.id);
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
              onClick={() => onSave({ name, position, rating, groupId })}
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
                 {isActive ? 'Selecionado' : 'Selecionar Animal'}
               </button>

              <button 
                onClick={() => onDelete(player.id)}
                className="w-full py-3 rounded-xl font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-colors"
              >
                Remover Animal
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

