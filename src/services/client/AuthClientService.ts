import supabase from "@/app/lib/supabase";

export async function getAuthHeaders(customHeaders: Record<string, string> = {}): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  if (typeof window !== "undefined") {
    try {
      const { data } = await supabase.auth.getSession();
      let token = data?.session?.access_token;

      if (!token) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes("auth-token") || key.startsWith("sb-"))) {
            const val = localStorage.getItem(key);
            if (val) {
              try {
                const parsed = JSON.parse(val);
                token = parsed?.access_token || parsed?.currentSession?.access_token;
                if (token) break;
              } catch (e) { }
            }
          }
        }
      }

      if (token && !headers["Authorization"]) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn("Could not retrieve auth session header:", e);
    }
  }

  return headers;
}

async function handleResponse(res: Response) {
  let result: any = {};
  try {
    const text = await res.text();
    result = text ? JSON.parse(text) : {};
  } catch (e) {
    result = { error: `Server response error (${res.status})` };
  }
  if (!res.ok) {
    if (res.status === 401 || res.status === 400) {
      return { data: { user: null }, error: result.error || "Auth session missing" };
    }
    console.warn(`[AuthClientService Error ${res.status}] URL: ${res.url} - Error:`, result.error || `HTTP error ${res.status}`);
    return { data: null, error: result.error || `HTTP error ${res.status}` };
  }
  return result;
}

export class AuthClientService {
  static async signIn(email: string, password: string) {
    const res = await fetch("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  }

  static async signUp(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone: string;
    country: string;
  }) {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  }

  static async googleSignIn(redirectTo: string) {
    const res = await fetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ redirectTo }),
    });
    return handleResponse(res);
  }

  static async getUser() {
    const headers = await getAuthHeaders();
    const res = await fetch("/api/user", { headers });
    return handleResponse(res);
  }

  static async updateUserMetadata(metadata: Record<string, any>) {
    const headers = await getAuthHeaders();
    const res = await fetch("/api/auth/update-user", {
      method: "POST",
      headers,
      body: JSON.stringify({ metadata }),
    });
    return handleResponse(res);
  }

  static clearSessionData() {
    if (typeof window === "undefined") return;

    const prefixes = [
      "sb-",
      "auth-storage",
      "todovisa_",
      "vipro_",
      "preform_",
      "preformulario_",
      "agent_app_",
      "client_docs_user_",
    ];

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (prefixes.some((p) => key.startsWith(p)) || key.includes("auth-token")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }

  static async signOut() {
    if (typeof window !== "undefined") {
      await supabase.auth.signOut().catch(() => null);
      this.clearSessionData();
    }
  }
}
