/**
 * TodoVisa OTP Storage & Verification Manager
 * Manages 6-digit One-Time Passwords with TTL, rate-limiting, and attempt counting.
 */

export interface OtpRecord {
  email: string;
  purpose: string;
  code: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}

class OtpStore {
  private store: Map<string, OtpRecord> = new Map();
  private readonly DEFAULT_TTL_MINUTES = 10;
  private readonly RESEND_COOLDOWN_SECONDS = 60;
  private readonly MAX_ATTEMPTS = 5;

  private getKey(email: string, purpose: string): string {
    return `${email.trim().toLowerCase()}:${purpose.trim().toLowerCase()}`;
  }

  /**
   * Generates a new 6-digit OTP code for a given email and purpose.
   */
  public generateOtp(
    email: string,
    purpose: string = "verification",
    ttlMinutes: number = this.DEFAULT_TTL_MINUTES
  ): { code?: string; expiresAt?: number; error?: string; canSend: boolean; remainingSeconds?: number } {
    const key = this.getKey(email, purpose);
    const existing = this.store.get(key);
    const now = Date.now();

    if (existing) {
      const elapsedSeconds = Math.floor((now - existing.lastSentAt) / 1000);
      if (elapsedSeconds < this.RESEND_COOLDOWN_SECONDS) {
        const remainingSeconds = this.RESEND_COOLDOWN_SECONDS - elapsedSeconds;
        return {
          canSend: false,
          remainingSeconds,
          error: `Debes esperar ${remainingSeconds} segundos antes de solicitar un nuevo código.`,
        };
      }
    }

    // Generate random 6-digit numeric string
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = now + ttlMinutes * 60 * 1000;

    const record: OtpRecord = {
      email: email.trim().toLowerCase(),
      purpose: purpose.trim().toLowerCase(),
      code,
      expiresAt,
      attempts: 0,
      lastSentAt: now,
    };

    this.store.set(key, record);
    return { code, expiresAt, canSend: true };
  }

  /**
   * Verifies an OTP code for a given email and purpose.
   */
  public verifyOtp(
    email: string,
    code: string,
    purpose: string = "verification"
  ): { valid: boolean; error?: string; message?: string } {
    const key = this.getKey(email, purpose);
    const record = this.store.get(key);
    const now = Date.now();

    if (!record) {
      return {
        valid: false,
        error: "No existe un código OTP activo para este correo. Solicita uno nuevo.",
      };
    }

    if (now > record.expiresAt) {
      this.store.delete(key);
      return {
        valid: false,
        error: "El código OTP ha expirado. Por favor, solicita un nuevo código.",
      };
    }

    if (record.attempts >= this.MAX_ATTEMPTS) {
      this.store.delete(key);
      return {
        valid: false,
        error: "Has superado el número máximo de intentos fallidos. Por seguridad, solicita un nuevo código.",
      };
    }

    const cleanInputCode = code.trim();
    if (record.code !== cleanInputCode) {
      record.attempts += 1;
      const remainingAttempts = this.MAX_ATTEMPTS - record.attempts;

      if (remainingAttempts <= 0) {
        this.store.delete(key);
        return {
          valid: false,
          error: "Código incorrecto. Has superado el número máximo de intentos. Solicita un nuevo código.",
        };
      }

      return {
        valid: false,
        error: `Código incorrecto. Te quedan ${remainingAttempts} intento${remainingAttempts === 1 ? "" : "s"}.`,
      };
    }

    // Single-use code: delete on success
    this.store.delete(key);
    return {
      valid: true,
      message: "Código de verificación validado correctamente.",
    };
  }

  /**
   * Checks if an email can request a resend right now.
   */
  public canResendOtp(email: string, purpose: string = "verification"): { canResend: boolean; remainingSeconds: number } {
    const key = this.getKey(email, purpose);
    const record = this.store.get(key);
    if (!record) return { canResend: true, remainingSeconds: 0 };

    const elapsedSeconds = Math.floor((Date.now() - record.lastSentAt) / 1000);
    if (elapsedSeconds < this.RESEND_COOLDOWN_SECONDS) {
      return {
        canResend: false,
        remainingSeconds: this.RESEND_COOLDOWN_SECONDS - elapsedSeconds,
      };
    }

    return { canResend: true, remainingSeconds: 0 };
  }

  /**
   * Clears expired OTP records from memory.
   */
  public cleanupExpired(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Helper for testing/debugging
   */
  public clearAll(): void {
    this.store.clear();
  }
}

export const otpStore = new OtpStore();
