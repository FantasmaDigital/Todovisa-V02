import { AuthClientService } from "@/services/client/AuthClientService";

export class AuthService {
  static async signIn(email: string, password: string) {
    return AuthClientService.signIn(email, password);
  }

  static async signUp(data: { email: string; password: string; first_name: string; last_name: string; phone: string; country: string }) {
    return AuthClientService.signUp(data);
  }

  static async googleSignIn(redirectTo: string) {
    return AuthClientService.googleSignIn(redirectTo);
  }

  static async getUser() {
    return AuthClientService.getUser();
  }

  static async updateUser(metadata: Record<string, any>) {
    return AuthClientService.updateUserMetadata(metadata);
  }

  static async signOut() {
    return AuthClientService.signOut();
  }

  static async sendOtp(email: string, purpose: string = "verification", name?: string) {
    return AuthClientService.sendOtp(email, purpose, name);
  }

  static async verifyOtp(email: string, code: string, purpose: string = "verification") {
    return AuthClientService.verifyOtp(email, code, purpose);
  }
}

