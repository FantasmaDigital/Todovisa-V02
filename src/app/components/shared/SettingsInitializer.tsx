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
