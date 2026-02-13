/**
 * Global State Management using Zustand
 */

import { create } from 'zustand';
import { User } from '../types';

// ===== AUTH STORE =====

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (loading) => set({ isLoading: loading }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));

// ===== APP STORE (General app state) =====

interface AppState {
  vesselId: string | null;
  vesselName: string | null;
  offlineMode: boolean;
  syncPending: boolean;
  setVessel: (id: string, name: string) => void;
  setOfflineMode: (offline: boolean) => void;
  setSyncPending: (pending: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  vesselId: null,
  vesselName: null,
  offlineMode: false,
  syncPending: false,
  setVessel: (id, name) => set({ vesselId: id, vesselName: name }),
  setOfflineMode: (offline) => set({ offlineMode: offline }),
  setSyncPending: (pending) => set({ syncPending: pending }),
}));
