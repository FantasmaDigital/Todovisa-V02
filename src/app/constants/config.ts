// Centralized System Configuration for Prices & Commission Rates

export const DEFAULT_PRICING = {
  viproPrice: 19.99,
  fullServicePrice: 100.00,
  agencyReferralRate: 20, // 20% for agency referrals
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

  // Clean up legacy 30% cache if present in user's browser
  if (storedAgencyRate === "30" || storedAgencyRate === "0.3") {
    localStorage.removeItem("agencyReferralRate");
  }
  const activeAgencyRate = localStorage.getItem("agencyReferralRate");

  const parseRate = (val: string | null, fallback: number) => {
    if (!val || isNaN(Number(val))) return fallback;
    const num = Number(val);
    const result = num > 0 && num < 1 ? Math.round(num * 100) : Math.round(num);
    return result === 30 ? 20 : result;
  };

  return {
    viproPrice: storedVipro && !isNaN(Number(storedVipro)) ? Number(storedVipro) : DEFAULT_PRICING.viproPrice,
    fullServicePrice: storedFull && !isNaN(Number(storedFull)) ? Number(storedFull) : DEFAULT_PRICING.fullServicePrice,
    agencyReferralRate: parseRate(activeAgencyRate, DEFAULT_PRICING.agencyReferralRate),
    agentCommissionRate: parseRate(storedAgentRate, DEFAULT_PRICING.agentCommissionRate),
  };
}
