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

  static async resetPasswordForEmail(email: string) {
    return await supabase.auth.resetPasswordForEmail(email);
  }

  static async getUser(token?: string | null) {
    if (token) {
      return await supabase.auth.getUser(token);
    }
    return await supabase.auth.getUser();
  }

  static async updateUserMetadata(attributes: Record<string, any>, token?: string | null) {
    const client = getScopedSupabaseClient(token);
    return await client.auth.updateUser({ data: attributes });
  }
}
