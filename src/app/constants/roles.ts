/**
 * Centralized User Roles constants
 */
export const ROLES = {
  USER: 'user' as const,
  MODERATOR: 'moderator' as const,
  ADMIN: 'admin' as const,
  AGENT: 'agent' as const,
  AGENCY: 'agency' as const,
} as const;

export const COMMISSION_RATES = {
  AGENCY_REFERRAL: 30, // 30% for agency referral link (70% TodoVisa)
  EXPERT_AGENT: 60,    // 60% for expert advisor (40% TodoVisa)
  STANDARD_AGENT: 40,  // 40% for standard advisor (60% TodoVisa)
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];
