// Centralized System Configuration for Prices & Commission Rates

export const DEFAULT_PRICING = {
  viproPrice: 19.99,
  fullServicePrice: 100.00,
  agencyReferralRate: 30, // 30% for agency referrals
  agentCommissionRate: 60, // 60% for all advisors
};

/**
 * Reads active prices and commission rates from localStorage (synced with DB system_settings)
 * with fallback to environment variables and central defaults.
 */
export function getSystemConfig() {
  if (typeof window === "undefined") {
    return DEFAULT_PRICING;
  }

  const storedVipro = localStorage.getItem("viproPrice");
  const storedFull = localStorage.getItem("fullServicePrice");
  const storedAgencyRate = localStorage.getItem("agencyReferralRate");
  const storedAgentRate = localStorage.getItem("agentCommissionRate");

  const parseRate = (val: string | null, fallback: number) => {
    if (!val || isNaN(Number(val))) return fallback;
    const num = Number(val);
    return num > 0 && num < 1 ? Math.round(num * 100) : Math.round(num);
  };

  return {
    viproPrice: storedVipro && !isNaN(Number(storedVipro)) ? Number(storedVipro) : DEFAULT_PRICING.viproPrice,
    fullServicePrice: storedFull && !isNaN(Number(storedFull)) ? Number(storedFull) : DEFAULT_PRICING.fullServicePrice,
    agencyReferralRate: parseRate(storedAgencyRate, DEFAULT_PRICING.agencyReferralRate),
    agentCommissionRate: parseRate(storedAgentRate, DEFAULT_PRICING.agentCommissionRate),
  };
}
