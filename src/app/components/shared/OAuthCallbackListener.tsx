"use client";

import { useEffect } from "react";
import supabase from "@/app/lib/supabase";
import { useAuthStore } from "@/app/store/authStore";
import { AuthService } from "@/app/service/AuthService";
import { AuthClientService } from "@/services/client/AuthClientService";

export function OAuthCallbackListener() {
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        useAuthStore.getState().clearUser();
        AuthClientService.clearSessionData();
        return;
      }

      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") && session?.user) {
        const u = session.user;
        const metadata = u.user_metadata || {};
        const existingRole = useAuthStore.getState().user?.role;
        const userData = {
          id: u.id,
          email: u.email || "",
          firstName: metadata.first_name || metadata.full_name?.split(" ")[0] || metadata.name?.split(" ")[0] || "Usuario",
          lastName: metadata.last_name || metadata.full_name?.split(" ").slice(1).join(" ") || "",
          phone: metadata.phone || "",
          country: metadata.country || "El Salvador",
          role: metadata.role || existingRole || "user",
          photoUrl: metadata.photo_url || metadata.avatar_url || metadata.picture || null,
          hasPaidVipro: Boolean(metadata.has_paid_vipro),
          hasPaidAdvisor: Boolean(metadata.has_paid_advisor),
          viproCompleted: Boolean(metadata.vipro_completed),
        };

        setUser(userData);

        if (event === "SIGNED_IN") {
          try {
            await AuthService.updateUser({
              first_name: userData.firstName,
              last_name: userData.lastName,
              photo_url: userData.photoUrl,
            });
          } catch (_) {}
        }

        if (window.location.hash && window.location.hash.includes("access_token=")) {
          window.history.replaceState(null, "", window.location.pathname);
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [setUser]);

  return null;
}
