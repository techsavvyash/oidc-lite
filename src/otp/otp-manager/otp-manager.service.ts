import { Injectable } from '@nestjs/common';

@Injectable()
export class OtpManagerService {
    otp: string = '';
    async generateOtp() {
        this.otp = Math.floor(100000 + Math.random() * 900000).toString();
        return this.otp;
    }
    async validateOtp(otp: string) {
        return otp === this.otp;
    }
    async timeOutOtp() {
        this.otp = '';
    }
}