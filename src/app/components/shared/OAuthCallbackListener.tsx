"use client";

import { useEffect } from "react";
import supabase from "@/app/lib/supabase";
import { useAuthStore } from "@/app/store/authStore";
import { AuthService } from "@/app/service/AuthService";

export function OAuthCallbackListener() {
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOAuthCallback = async () => {
      const hash = window.location.hash;

      // 1. Process implicit hash flow (#access_token=...&refresh_token=...)
      if (hash && hash.includes("access_token=")) {
        try {
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");

          if (accessToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || "",
            });

            if (!error && data?.session?.user) {
              const u = data.session.user;
              const metadata = u.user_metadata || {};

              const userData = {
                id: u.id,
                email: u.email || "",
                firstName: metadata.first_name || metadata.full_name?.split(" ")[0] || metadata.name?.split(" ")[0] || "Usuario",
                lastName: metadata.last_name || metadata.full_name?.split(" ").slice(1).join(" ") || "",
                phone: metadata.phone || "",
                country: metadata.country || "El Salvador",
                role: metadata.role || "user",
                photoUrl: metadata.photo_url || metadata.avatar_url || metadata.picture || null,
                hasPaidVipro: Boolean(metadata.has_paid_vipro),
                hasPaidAdvisor: Boolean(metadata.has_paid_advisor),
                viproCompleted: Boolean(metadata.vipro_completed),
              };

              setUser(userData);
              await AuthService.updateUser({
                first_name: userData.firstName,
                last_name: userData.lastName,
                photo_url: userData.photoUrl,
              }).catch(() => null);

              // Clean hash fragment from URL bar cleanly without page reload
              window.history.replaceState(null, "", window.location.pathname);
            }
          }
        } catch (err) {
          console.error("Error processing OAuth hash callback:", err);
        }
      }

      // 2. Listen for onAuthStateChange events
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user) {
          const u = session.user;
          const metadata = u.user_metadata || {};
          const userData = {
            id: u.id,
            email: u.email || "",
            firstName: metadata.first_name || metadata.full_name?.split(" ")[0] || metadata.name?.split(" ")[0] || "Usuario",
            lastName: metadata.last_name || metadata.full_name?.split(" ").slice(1).join(" ") || "",
            phone: metadata.phone || "",
            country: metadata.country || "El Salvador",
            role: metadata.role || "user",
            photoUrl: metadata.avatar_url || metadata.picture || metadata.photo_url || null,
            hasPaidVipro: Boolean(metadata.has_paid_vipro),
            hasPaidAdvisor: Boolean(metadata.has_paid_advisor),
            viproCompleted: Boolean(metadata.vipro_completed),
          };
          setUser(userData);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    };

    handleOAuthCallback();
  }, [setUser]);

  return null;
}
