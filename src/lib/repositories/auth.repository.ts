import supabase, { getScopedSupabaseClient } from "@/app/lib/supabase";

export class AuthRepository {
  static async signIn(email: string, password: string) {
    return await supabase.auth.signInWithPassword({ email, password });
  }

  static async signUp(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone: string;
    country: string;
  }) {
    return await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          country: data.country,
        },
      },
    });
  }

  static async signInWithOAuth(provider: 'google', redirectTo?: string) {
    const origin = typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
    const targetUrl = redirectTo || origin;
    return await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: targetUrl,
      },
    });
  }

  static async resetPasswordForEmail(email: string, options?: { redirectTo?: string }) {
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://todovisa.com";
    const defaultRedirect = `${siteUrl}/auth/reset-password`;
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: options?.redirectTo || defaultRedirect,
    });
  }

  static async getUser(token?: string | null) {
    if (token) {
      return await supabase.auth.getUser(token);
    }
    return await supabase.auth.getUser();
  }

  static async updateUserMetadata(attributes: Record<string, any>, token?: string | null) {
    const client = getScopedSupabaseClient(token);
    if (token) {
      const { error: sessionErr } = await client.auth.setSession({
        access_token: token,
        refresh_token: token, // Use token as fallback refresh_token to prevent "missing" session errors
      });
      if (sessionErr) {
        console.error("[AuthRepository.updateUserMetadata] setSession error:", sessionErr.message);
      }
    }

    const res = await client.auth.updateUser({ data: attributes });

    if (!res.error) {
      try {
        const { data: { user } } = await client.auth.getUser();
        if (user) {
          const profileUpdates: Record<string, any> = {};
          if (attributes.first_name !== undefined) profileUpdates.first_name = attributes.first_name;
          if (attributes.last_name !== undefined) profileUpdates.last_name = attributes.last_name;
          if (attributes.photo_url !== undefined) profileUpdates.photo_url = attributes.photo_url;
          if (attributes.avatar_changes_this_month !== undefined) profileUpdates.avatar_changes_this_month = attributes.avatar_changes_this_month;
          if (attributes.last_avatar_change_month !== undefined) profileUpdates.last_avatar_change_month = attributes.last_avatar_change_month;
          if (attributes.expediente_status !== undefined) profileUpdates.expediente_status = attributes.expediente_status;
          // Store custom metadata inside document_reviews JSONB column on profiles
          const customMeta: Record<string, any> = {};
          if (attributes.has_paid_vipro !== undefined) customMeta.has_paid_vipro = attributes.has_paid_vipro;
          if (attributes.has_paid_advisor !== undefined) customMeta.has_paid_advisor = attributes.has_paid_advisor;
          if (attributes.assigned_agent_id !== undefined) customMeta.assigned_agent_id = attributes.assigned_agent_id;
          if (attributes.assigned_agency_name !== undefined) customMeta.assigned_agency_name = attributes.assigned_agency_name;
          if (attributes.last_paypal_tx !== undefined) customMeta.last_paypal_tx = attributes.last_paypal_tx;
          if (attributes.vipro_score !== undefined) customMeta.vipro_score = attributes.vipro_score;
          if (attributes.vipro_completed !== undefined) customMeta.vipro_completed = attributes.vipro_completed;
          if (attributes.vipro_destination !== undefined) customMeta.vipro_destination = attributes.vipro_destination;

          // Sync client document uploads so agents can access them
          if (attributes.client_docs !== undefined) profileUpdates.client_docs = attributes.client_docs;
          // Sync DS-160 consular form fields
          if (attributes.ds160_full_name !== undefined) profileUpdates.ds160_full_name = attributes.ds160_full_name;
          if (attributes.ds160_passport_num !== undefined) profileUpdates.ds160_passport_num = attributes.ds160_passport_num;
          if (attributes.ds160_birth_date !== undefined) profileUpdates.ds160_birth_date = attributes.ds160_birth_date;
          if (attributes.ds160_purpose_of_trip !== undefined) profileUpdates.ds160_purpose_of_trip = attributes.ds160_purpose_of_trip;
          if (attributes.ds160_has_assets !== undefined) profileUpdates.ds160_has_assets = attributes.ds160_has_assets;
          if (attributes.ds160_confirmed !== undefined) profileUpdates.ds160_confirmed = attributes.ds160_confirmed;
          if (attributes.appointment_request !== undefined) profileUpdates.appointment_request = attributes.appointment_request;
          if (attributes.cita_details !== undefined) profileUpdates.cita_details = attributes.cita_details;

          const existingReviews = (attributes.document_reviews && typeof attributes.document_reviews === 'object') ? attributes.document_reviews : {};
          if (Object.keys(customMeta).length > 0 || attributes.document_reviews !== undefined) {
            profileUpdates.document_reviews = { ...existingReviews, ...customMeta };
          }

          if (Object.keys(profileUpdates).length > 0) {
            await client.from("profiles").update(profileUpdates).eq("id", user.id);
          }
        }
      } catch (e) {
        console.error("[AuthRepository.updateUserMetadata] Profiles table update failed:", e);
      }
    }

    return res;
  }
}
