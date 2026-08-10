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
  assignedAgentId?: string | null;
  assignedAgencyName?: string | null;
  viproScore?: number | null;
  viproCompleted?: boolean;
  viproDestination?: string | null;
  hasPaidVipro?: boolean;
  photoUrl?: string | null;
  avatarChangesThisMonth?: number;
  lastAvatarChangeMonth?: string;
  ds160FullName?: string | null;
  ds160PassportNum?: string | null;
  ds160BirthDate?: string | null;
  ds160PurposeOfTrip?: string | null;
  ds160HasAssets?: boolean;
  ds160Confirmed?: boolean;
  expedienteStatus?: 'draft' | 'submitted' | 'approved';
  role?: string;
  hasCompletedVipro?: boolean;
  clientDocs?: Record<string, string>;
  documentReviews?: Record<string, any>;
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
    }
  )
);
