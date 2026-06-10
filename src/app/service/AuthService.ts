export class AuthService {
    static async signIn(email: string, password: string) {
        const res = await fetch('/api/auth/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Error al iniciar sesión');
        return result;
    }

    static async signUp(data: { email: string, password: string, first_name: string, last_name: string, phone: string, country: string }) {
        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Error al crear la cuenta');
        return result;
    }

    static async googleSignIn(redirectTo: string) {
        const res = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ redirectTo }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Error al iniciar sesión con Google');
        return result;
    }

    static async getUser() {
        const res = await fetch('/api/user');
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Error al obtener el usuario');
        return result;
    }
}
