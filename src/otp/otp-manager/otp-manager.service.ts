import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class OtpManagerService {
  private otpStore: Map<string, number> = new Map(); // Stores OTP and its expiration time

  timeOut: number = parseInt(process.env.OTP_TIMEOUT);

  async generateOtp(length: number = 6): Promise<string> {
    const otp = this.generateSecureOtp(length);
    const expirationTime = Date.now() + this.timeOut * 1000; // OTP valid for 5 minutes
    this.otpStore.set(otp, expirationTime);
    return otp;
  }

  private generateSecureOtp(length: number): string {
    return crypto.randomInt(100000, 999999).toString().padStart(length, '0');
  }

  async validateOtp(otp: string): Promise<boolean> {
    const expirationTime = this.otpStore.get(otp);
    if (!expirationTime) {
      return false; // OTP does not exist
    }

    const isValid = Date.now() < expirationTime;
    if (isValid) {
      this.otpStore.delete(otp); // Invalidate OTP after use
    }
    return isValid;
  }

  async cleanExpiredOtps(): Promise<void> {
    const now = Date.now();
    for (const [otp, expirationTime] of this.otpStore.entries()) {
      if (now >= expirationTime) {
        this.otpStore.delete(otp);
      }
    }
  }
}
