import { Body, Controller, Post } from '@nestjs/common';
import { OtpService } from './otp.service';
import { OtpDto, OtpResponseDto, VerifyOtpDto } from './otp.dto';

@Controller('otp')
export class OtpController {
  constructor(private otpService: OtpService) {}

  @Post('send')
  async sendOtp(@Body() body: OtpDto): Promise<OtpResponseDto> {
    // type can be 'mail', 'sms', 'whatsapp' // to is the recipient depending on the type
    return await this.otpService.sendOtp(body.type, body.to);
  }

  @Post('verify')
  async verifyOtp(@Body() body: VerifyOtpDto): Promise<OtpResponseDto> {
    return await this.otpService.validateOtp(body.otp);
  }
}