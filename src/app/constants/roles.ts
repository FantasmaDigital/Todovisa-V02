/**
 * Centralized User Roles enum and constants
 */
export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  AGENT = 'agent',
  AGENCY = 'agency',
}

export const ROLES = {
  USER: UserRole.USER,
  MODERATOR: UserRole.MODERATOR,
  ADMIN: UserRole.ADMIN,
  AGENT: UserRole.AGENT,
  AGENCY: UserRole.AGENCY,
} as const;

export const COMMISSION_RATES = {
  AGENCY_REFERRAL: 20, // 20% for agency referral link (80% TodoVisa)
  EXPERT_AGENT: 60,    // 60% for expert advisor (40% TodoVisa)
  STANDARD_AGENT: 40,  // 40% for standard advisor (60% TodoVisa)
} as const;


