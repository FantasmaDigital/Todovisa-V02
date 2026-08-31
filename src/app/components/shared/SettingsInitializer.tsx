"use client";

import { useEffect } from "react";
import { SettingsClientService } from "@/services/client/SettingsClientService";

export function SettingsInitializer() {
  useEffect(() => {
    async function initSettings() {
      try {
        const settings = await SettingsClientService.getSettings();
        if (settings) {
          let hasChanges = false;
          
          if (settings.vipro_price) {
            const currentVipro = localStorage.getItem("viproPrice");
            if (currentVipro !== settings.vipro_price) {
              localStorage.setItem("viproPrice", settings.vipro_price);
              hasChanges = true;
            }
          }
          
          if (settings.full_service_price) {
            const currentFullService = localStorage.getItem("fullServicePrice");
            if (currentFullService !== settings.full_service_price) {
              localStorage.setItem("fullServicePrice", settings.full_service_price);
              hasChanges = true;
            }
          }

          if (settings.agency_referral_rate) {
            const sanitizedRate = (settings.agency_referral_rate === "30" || settings.agency_referral_rate === "0.3") ? "20" : settings.agency_referral_rate;
            const currentAgency = localStorage.getItem("agencyReferralRate");
            if (currentAgency !== sanitizedRate) {
              localStorage.setItem("agencyReferralRate", sanitizedRate);
              hasChanges = true;
            }
          }

          if (settings.agent_commission_rate) {
            const currentAgent = localStorage.getItem("agentCommissionRate");
            if (currentAgent !== settings.agent_commission_rate) {
              localStorage.setItem("agentCommissionRate", settings.agent_commission_rate);
              hasChanges = true;
            }
          }

          if (settings.visa_destinations) {
            const currentDest = localStorage.getItem("visa_destinations");
            if (currentDest !== settings.visa_destinations) {
              localStorage.setItem("visa_destinations", settings.visa_destinations);
              hasChanges = true;
            }
          }
          
          if (hasChanges) {
            // Trigger storage event to notify other components on the same page
            window.dispatchEvent(new Event("storage"));
          }
        }
      } catch (err) {
        console.error("[SettingsInitializer Error]", err);
      }
    }

    initSettings();
  }, []);

  return null;
}
