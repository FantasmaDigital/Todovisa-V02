import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  country: string;
  hasPaidAdvisor?: boolean;
  hasPaidVipro?: boolean;
  assignedAgentId?: string | null;
  hasCompletedVipro?: boolean;
  viproScore?: number | null;
  viproCompleted?: boolean;
  viproDestination?: string | null;
  photoUrl?: string | null;
  avatarChangesThisMonth?: number;
  lastAvatarChangeMonth?: string;
}

interface AuthState {
  user: UserData | null;
  setUser: (user: UserData) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: 'auth-storage', // Nombre para el localStorage
      partialize: (state) => ({
        user: state.user
          ? {
              ...state.user,
              photoUrl: null, // Exclude heavy image from localStorage to prevent QuotaExceededError
            }
          : null,
      }),
    }
  )
);
