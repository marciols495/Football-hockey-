import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type Position = string;

export interface Group {
  id: string;
  name: string;
}

export interface Player {
  id: string;
  groupId: string;
  name: string;
  position: Position;
  rating: number;
  points: number;
  pitchX?: number; // 0 to 1 relative position on pitch
  pitchY?: number; // 0 to 1 relative position on pitch
  isOnPitch?: boolean;
}

interface TeamState {
  groups: Group[];
  activeGroupId: string;
  players: Player[];
  activePlayerId: string | null;
  addGroup: (name: string) => void;
  removeGroup: (id: string) => void;
  setActiveGroup: (id: string) => void;
  addPlayer: (player: Omit<Player, 'id' | 'points'>) => void;
  updatePlayer: (id: string, updates: Partial<Player>) => void;
  removePlayer: (id: string) => void;
  setActivePlayer: (id: string | null) => void;
  incrementPoints: (id: string) => void;
  resetPlayerPoints: (id: string) => void;
  resetAllPoints: () => void;
}

const defaultGroupId = uuidv4();

const defaultGroups: Group[] = [
  { id: defaultGroupId, name: 'Arena Principal' }
];

const defaultPlayers: Player[] = [
  { id: uuidv4(), groupId: defaultGroupId, name: 'T-Rex', position: 'DINOSSAURO', rating: 95, points: 0, pitchX: 0.5, pitchY: 0.15, isOnPitch: true },
  { id: uuidv4(), groupId: defaultGroupId, name: 'Leão', position: 'MAMÍFERO', rating: 88, points: 0, pitchX: 0.3, pitchY: 0.25, isOnPitch: true },
  { id: uuidv4(), groupId: defaultGroupId, name: 'Velociraptor', position: 'DINOSSAURO', rating: 86, points: 0, pitchX: 0.7, pitchY: 0.25, isOnPitch: true },
  { id: uuidv4(), groupId: defaultGroupId, name: 'Triceratops', position: 'DINOSSAURO', rating: 82, points: 0, pitchX: 0.25, pitchY: 0.5, isOnPitch: true },
  { id: uuidv4(), groupId: defaultGroupId, name: 'Elefante', position: 'MAMÍFERO', rating: 84, points: 0, pitchX: 0.5, pitchY: 0.5, isOnPitch: true },
  { id: uuidv4(), groupId: defaultGroupId, name: 'Crocodilo', position: 'RÉPTIL', rating: 85, points: 0, pitchX: 0.75, pitchY: 0.5, isOnPitch: true },
  { id: uuidv4(), groupId: defaultGroupId, name: 'Águia Real', position: 'AVE', rating: 78, points: 0, pitchX: 0.2, pitchY: 0.75, isOnPitch: true },
  { id: uuidv4(), groupId: defaultGroupId, name: 'Pteranodonte', position: 'DINOSSAURO', rating: 74, points: 0, pitchX: 0.4, pitchY: 0.75, isOnPitch: true },
  { id: uuidv4(), groupId: defaultGroupId, name: 'Tubarão Branco', position: 'PEIXE', rating: 92, points: 0, pitchX: 0.6, pitchY: 0.75, isOnPitch: true },
  { id: uuidv4(), groupId: defaultGroupId, name: 'Orca', position: 'MAMÍFERO', rating: 89, points: 0, pitchX: 0.8, pitchY: 0.75, isOnPitch: true },
  { id: uuidv4(), groupId: defaultGroupId, name: 'Brachiossauro', position: 'DINOSSAURO', rating: 88, points: 0, pitchX: 0.5, pitchY: 0.9, isOnPitch: true },
  { id: uuidv4(), groupId: defaultGroupId, name: 'Spinosaurus', position: 'DINOSSAURO', rating: 90, points: 0, isOnPitch: false },
  { id: uuidv4(), groupId: defaultGroupId, name: 'Sapo Cururu', position: 'ANFÍBIO', rating: 50, points: 0, isOnPitch: false },
  { id: uuidv4(), groupId: defaultGroupId, name: 'Louva-a-deus', position: 'INSETO', rating: 65, points: 0, isOnPitch: false },
];

export const useTeamStore = create<TeamState>()(
  persist(
    (set) => ({
      groups: defaultGroups,
      activeGroupId: defaultGroupId,
      players: defaultPlayers,
      activePlayerId: defaultPlayers[0].id,
      addGroup: (name) =>
        set((state) => {
          const newGroupId = uuidv4();
          return {
            groups: [...state.groups, { id: newGroupId, name }],
            activeGroupId: newGroupId
          };
        }),
      removeGroup: (id) =>
        set((state) => {
          const newGroups = state.groups.filter(g => g.id !== id);
          if (newGroups.length === 0) {
            const defaultId = uuidv4();
            return {
              groups: [{ id: defaultId, name: 'Arena Principal' }],
              activeGroupId: defaultId,
              players: state.players.filter(p => p.groupId !== id)
            };
          }
          return {
            groups: newGroups,
            activeGroupId: state.activeGroupId === id ? newGroups[0].id : state.activeGroupId,
            players: state.players.filter(p => p.groupId !== id)
          };
        }),
      setActiveGroup: (id) => set({ activeGroupId: id }),
      addPlayer: (player) =>
        set((state) => ({
          players: [...state.players, { ...player, id: uuidv4(), points: 0 }],
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
      incrementPoints: (id) =>
        set((state) => ({
          players: state.players.map((p) =>
            p.id === id ? { ...p, points: p.points + 1 } : p
          ),
        })),
      resetPlayerPoints: (id) =>
        set((state) => ({
          players: state.players.map((p) =>
            p.id === id ? { ...p, points: 0 } : p
          ),
        })),
      resetAllPoints: () =>
        set((state) => ({
          players: state.players.map((p) => 
            p.groupId === state.activeGroupId ? { ...p, points: 0 } : p
          ),
        })),
    }),
    {
      name: 'team-storage',
    }
  )
);
