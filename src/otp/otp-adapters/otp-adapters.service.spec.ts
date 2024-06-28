import { Test, TestingModule } from '@nestjs/testing';
import { OtpAdaptersService } from './otp-adapters.service';
import { AdapterFactory } from '@samagra-x/uci-adapters-factory';

jest.mock('@samagra-x/uci-adapters-factory', () => ({
  AdapterFactory: {
    getAdapter: jest.fn(),
  },
}));

describe('OtpAdaptersService', () => {
  let service: OtpAdaptersService;
  let mailAdapterMock: any;
  let smsAdapterMock: any;
  let whatsappAdapterMock: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OtpAdaptersService],
    }).compile();

    service = module.get<OtpAdaptersService>(OtpAdaptersService);

    mailAdapterMock = {
      sendMessage: jest.fn(),
    };
    smsAdapterMock = {
      sendMessage: jest.fn(),
    };
    whatsappAdapterMock = {
      sendMessage: jest.fn(),
    };

    (AdapterFactory.getAdapter as jest.Mock).mockImplementation(({ type }) => {
      if (type === 'NodemailerEmail') return mailAdapterMock;
      if (type === 'TwilioSms') return smsAdapterMock;
      if (type === 'GupshupWhatsApp') return whatsappAdapterMock;
      return null;
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('mailOtpAdapter', () => {
    it('should send OTP via mail adapter', async () => {
      const otp = '123456';
      const to = 'test@example.com';
      const responseMock = { success: true };
      mailAdapterMock.sendMessage.mockResolvedValue(responseMock);

      const result = await service.mailOtpAdapter(otp, to);

      expect(AdapterFactory.getAdapter).toHaveBeenCalledWith({
        type: 'NodemailerEmail',
        config: service.mailConfig,
      });
      expect(mailAdapterMock.sendMessage).toHaveBeenCalledWith({
        to: [to],
        html: `<p>Your OTP is ${otp}</p>`,
        subject: 'Your OIDC OTP',
      });
      expect(result).toEqual(responseMock);
    });
  });

  describe('smsOtpAdapter', () => {
    it('should send OTP via sms adapter', async () => {
      const otp = '123456';
      const to = '1234567890';
      const responseMock = { success: true };
      smsAdapterMock.sendMessage.mockResolvedValue(responseMock);

      const result = await service.smsOtpAdapter(otp, to);

      expect(AdapterFactory.getAdapter).toHaveBeenCalledWith({
        type: 'TwilioSms',
        config: service.smsConfig,
      });
      expect(smsAdapterMock.sendMessage).toHaveBeenCalledWith({
        to,
        content: `Your OTP for OIDC is ${otp}`,
      });
      expect(result).toEqual(responseMock);
    });
  });

  describe('whatsappOtpAdapter', () => {
    it('should send OTP via whatsapp adapter', async () => {
      const otp = '123456';
      const to = '1234567890';
      const responseMock = { success: true };
      whatsappAdapterMock.sendMessage.mockResolvedValue(responseMock);

      const result = await service.whatsappOtpAdapter(otp, to);

      expect(AdapterFactory.getAdapter).toHaveBeenCalledWith({
        type: 'GupshupWhatsApp',
        config: service.whatsappConfig,
      });
      expect(whatsappAdapterMock.sendMessage).toHaveBeenCalledWith({
        to,
        content: `Your OTP for OIDC is ${otp}`,
      });
      expect(result).toEqual(responseMock);
    });
  });
});
