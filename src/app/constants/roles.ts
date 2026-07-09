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

export type UserRole = typeof ROLES[keyof typeof ROLES];
