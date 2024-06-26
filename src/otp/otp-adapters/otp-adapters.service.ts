import { Injectable } from '@nestjs/common';
import { AdapterFactory } from '@samagra-x/uci-adapters-factory';
import {
  MailConfigDTO,
  SmsConfigDTO,
  WhatsappConfigDTO,
} from './otp-adapter.dto';

@Injectable()
export class OtpAdaptersService {
  // CONFIGS
  mailConfig: MailConfigDTO = {
    from: process.env.MAIL_FROM,
    host: process.env.MAIL_HOST,
    user: process.env.MAIL_USER,
    password: process.env.MAIL_PASSWORD,
    port: parseInt(process.env.MAIL_PORT),
    secure: process.env.MAIL_SECURE === 'true',
  };

  smsConfig: SmsConfigDTO = {
    accountSid: process.env.SMS_ACCOUNT_SID,
    authToken: process.env.SMS_AUTH_TOKEN,
    from: process.env.SMS_FROM,
  };

  whatsappConfig: WhatsappConfigDTO = {
    username2Way: process.env.WHATSAPP_USERNAME_2WAY,
    password2Way: process.env.WHATSAPP_PASSWORD_2WAY,
    usernameHSM: process.env.WHATSAPP_USERNAME_HSM,
    passwordHSM: process.env.WHATSAPP_PASSWORD_HSM,
  };

  // MAIL OTP ADAPTER
  async mailOtpAdapter(otp: string, to: string) {
    
    const mailAdapter = AdapterFactory.getAdapter({
      type: 'NodemailerEmail',
      config: this.mailConfig,
    });
    
    const res = await mailAdapter.sendMessage({
      //@ts-ignore
      to: [to],
      html: `<p>Your OTP is ${otp}</p>`,
      subject: 'Your OIDC OTP',
    });
    return res;
  }
  // SMS OTP ADAPTER
  async smsOtpAdapter(otp: string, to: string) {
    const smsAdapter = AdapterFactory.getAdapter({
      type: 'TwilioSms',
      config: this.smsConfig,
    });
    
    const res = await smsAdapter.sendMessage({
      //@ts-ignore
      to: to,
      content: `Your OTP for OIDC is ${otp}`,
    });
    return res;
  }
  // WHATSAPP OTP ADAPTER
  async whatsappOtpAdapter(otp: string, to: string) {
    const whatsappAdapter = AdapterFactory.getAdapter({
      type: 'GupshupWhatsApp',
      config: this.whatsappConfig,
    });
    const res = await whatsappAdapter?.sendMessage({
      //@ts-ignore
      to: to,
      content: `Your OTP for OIDC is ${otp}`,
    });
    return res;
  }
}
