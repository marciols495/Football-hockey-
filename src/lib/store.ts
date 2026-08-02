import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type Position = 'GOL' | 'DEF' | 'LAT' | 'MED' | 'ATA';

export interface Player {
  id: string;
  name: string;
  position: Position;
  rating: number;
  goals: number;
  pitchX?: number; // 0 to 1 relative position on pitch
  pitchY?: number; // 0 to 1 relative position on pitch
  isOnPitch?: boolean;
}

interface TeamState {
  players: Player[];
  activePlayerId: string | null;
  addPlayer: (player: Omit<Player, 'id' | 'goals'>) => void;
  updatePlayer: (id: string, updates: Partial<Player>) => void;
  removePlayer: (id: string) => void;
  setActivePlayer: (id: string | null) => void;
  incrementGoals: (id: string) => void;
  resetPlayerGoals: (id: string) => void;
  resetAllGoals: () => void;
}

const defaultPlayers: Player[] = [
  { id: uuidv4(), name: 'Fábio', position: 'ATA', rating: 77, goals: 0, pitchX: 0.2, pitchY: 0.25, isOnPitch: true },
  { id: uuidv4(), name: 'Gonçalo', position: 'ATA', rating: 73, goals: 0, pitchX: 0.5, pitchY: 0.15, isOnPitch: true },
  { id: uuidv4(), name: 'Hugo', position: 'ATA', rating: 86, goals: 0, pitchX: 0.8, pitchY: 0.25, isOnPitch: true },
  { id: uuidv4(), name: 'Bruno', position: 'MED', rating: 76, goals: 0, pitchX: 0.25, pitchY: 0.5, isOnPitch: true },
  { id: uuidv4(), name: 'Carlos', position: 'MED', rating: 84, goals: 0, pitchX: 0.5, pitchY: 0.5, isOnPitch: true },
  { id: uuidv4(), name: 'Diogo', position: 'MED', rating: 81, goals: 0, pitchX: 0.75, pitchY: 0.5, isOnPitch: true },
  { id: uuidv4(), name: 'Miguel', position: 'DEF', rating: 85, goals: 0, pitchX: 0.2, pitchY: 0.75, isOnPitch: true },
  { id: uuidv4(), name: 'Rui', position: 'DEF', rating: 79, goals: 0, pitchX: 0.4, pitchY: 0.75, isOnPitch: true },
  { id: uuidv4(), name: 'Tiago', position: 'DEF', rating: 82, goals: 0, pitchX: 0.6, pitchY: 0.75, isOnPitch: true },
  { id: uuidv4(), name: 'André', position: 'DEF', rating: 90, goals: 0, pitchX: 0.8, pitchY: 0.75, isOnPitch: true },
  { id: uuidv4(), name: 'João', position: 'GOL', rating: 88, goals: 0, pitchX: 0.5, pitchY: 0.9, isOnPitch: true },
  { id: uuidv4(), name: 'Filipe', position: 'ATA', rating: 81, goals: 0, isOnPitch: false },
  { id: uuidv4(), name: 'Nuno', position: 'MED', rating: 78, goals: 0, isOnPitch: false },
];

export const useTeamStore = create<TeamState>()(
  persist(
    (set) => ({
      players: defaultPlayers,
      activePlayerId: defaultPlayers[0].id,
      addPlayer: (player) =>
        set((state) => ({
          players: [...state.players, { ...player, id: uuidv4(), goals: 0 }],
        })),
      updatePlayer: (id, updates) =>
        set((state) => ({
          players: state.players.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
      removePlayer: (id) =>
        set((state) => ({
          players: state.players.filter((p) => p.id !== id),
          activePlayerId: state.activePlayerId === id ? null : state.activePlayerId,
        })),
      setActivePlayer: (id) => set({ activePlayerId: id }),
      incrementGoals: (id) =>
        set((state) => ({
          players: state.players.map((p) =>
            p.id === id ? { ...p, goals: p.goals + 1 } : p
          ),
        })),
      resetPlayerGoals: (id) =>
        set((state) => ({
          players: state.players.map((p) =>
            p.id === id ? { ...p, goals: 0 } : p
          ),
        })),
      resetAllGoals: () =>
        set((state) => ({
          players: state.players.map((p) => ({ ...p, goals: 0 })),
        })),
    }),
    {
      name: 'team-storage',
    }
  )
);
