import { Injectable } from '@nestjs/common';
import { OtpAdaptersService } from './otp-adapters/otp-adapters.service';
import { OtpManagerService } from './otp-manager/otp-manager.service';

@Injectable()
export class OtpService {
  constructor(
    private otpAdaptersService: OtpAdaptersService,
    private otpManagerService: OtpManagerService,
  ) {}

  time: number = parseInt(process.env.OTP_TIMEOUT);

  async sendOtp(type: string[], to: string) {
    const otpGenerated = await this.otpManagerService.generateOtp();

    try {
      if (type.includes('mail')) {
        await this.otpAdaptersService.mailOtpAdapter(otpGenerated, to);
      }
      if (type.includes('sms')) {
        await this.otpAdaptersService.smsOtpAdapter(otpGenerated, to);
      }
      if (type.includes('whatsapp')) {
        await this.otpAdaptersService.whatsappOtpAdapter(otpGenerated, to);
      }
      
      // Start the timer for the OTP
      this.timeOut();

      return {
        success: true,
        message: 'OTP sent successfully',
      };
    } catch (e) {
      // await this.otpManagerService.timeOutOtp();
      console.error(e);
      return {
        success: false,
        message: 'OTP failed to send',
      };
    }
  }

  async validateOtp(otp: string) {
    const res = await this.otpManagerService.validateOtp(otp);

    // await this.otpManagerService.timeOutOtp();

    if (res) {
      return {
        success: true,
        message: 'OTP is valid and verified',
      };
    }
    return {
      success: false,
      message: 'OTP is invalid or expired',
    };
  }

  //   @Timeout(100000)
  async timeOut() {
    setTimeout(() => {
      // this.otpManagerService.timeOutOtp();
    }, this.time*1000);
  }
}
