async function handleResponse(res: Response) {
  let result: any = {};
  try {
    const text = await res.text();
    result = text ? JSON.parse(text) : {};
  } catch (e) {
    result = { error: `Server response error (${res.status})` };
  }
  if (!res.ok) throw new Error(result.error || `HTTP error ${res.status}`);
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
    const res = await fetch("/api/user");
    return handleResponse(res);
  }

  static async updateUserMetadata(metadata: Record<string, any>) {
    const res = await fetch("/api/auth/update-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metadata }),
    });
    return handleResponse(res);
  }

  static async signOut() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("todovisa_user_session");
      localStorage.removeItem("vipro_completed");
      localStorage.removeItem("vipro_score");
    }
  }
}
