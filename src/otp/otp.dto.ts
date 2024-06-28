import { IsBoolean, IsEnum, IsString, Length } from 'class-validator';

export class OtpDto {
  @IsEnum(['mail', 'sms', 'whatsapp'], { each: true })
  type: string[];
  @IsString()
  to: string;
}

export class VerifyOtpDto {
  @IsString()
  @Length(6, 6)
  otp: string;
}

export class OtpResponseDto {
  @IsBoolean()
  success: boolean;
  message: string;
}
