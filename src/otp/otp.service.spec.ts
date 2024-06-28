import { Test, TestingModule } from '@nestjs/testing';
import { OtpService } from './otp.service';
import { OtpAdaptersService } from './otp-adapters/otp-adapters.service';
import { OtpManagerService } from './otp-manager/otp-manager.service';

jest.mock('./otp-adapters/otp-adapters.service');
jest.mock('./otp-manager/otp-manager.service');

describe('OtpService', () => {
  let service: OtpService;
  let otpAdaptersService: OtpAdaptersService;
  let otpManagerService: OtpManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OtpService, OtpAdaptersService, OtpManagerService],
    }).compile();

    service = module.get<OtpService>(OtpService);
    otpAdaptersService = module.get<OtpAdaptersService>(OtpAdaptersService);
    otpManagerService = module.get<OtpManagerService>(OtpManagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendOtp', () => {
    it('should send OTP via mail, sms, and whatsapp', async () => {
      const otpGenerated = '123456';
      jest
        .spyOn(otpManagerService, 'generateOtp')
        .mockResolvedValue(otpGenerated);
      jest.spyOn(otpAdaptersService, 'mailOtpAdapter').mockResolvedValue(null);
      jest.spyOn(otpAdaptersService, 'smsOtpAdapter').mockResolvedValue(null);
      jest
        .spyOn(otpAdaptersService, 'whatsappOtpAdapter')
        .mockResolvedValue(null);

      const result = await service.sendOtp(
        ['mail', 'sms', 'whatsapp'],
        'test@example.com',
      );

      expect(result).toEqual({
        success: true,
        message: 'OTP sent successfully',
      });

      expect(otpManagerService.generateOtp).toHaveBeenCalled();
      expect(otpAdaptersService.mailOtpAdapter).toHaveBeenCalledWith(
        otpGenerated,
        'test@example.com',
      );
      expect(otpAdaptersService.smsOtpAdapter).toHaveBeenCalledWith(
        otpGenerated,
        'test@example.com',
      );
      expect(otpAdaptersService.whatsappOtpAdapter).toHaveBeenCalledWith(
        otpGenerated,
        'test@example.com',
      );
    });
  });

  describe('validateOtp', () => {
    it('should return success true if OTP is valid', async () => {
      jest.spyOn(otpManagerService, 'validateOtp').mockResolvedValue(true);
      jest.spyOn(otpManagerService, 'timeOutOtp').mockResolvedValue(null);

      const result = await service.validateOtp('123456');

      expect(result).toEqual({
        success: true,
        message: 'OTP is valid and verified',
      });

      expect(otpManagerService.validateOtp).toHaveBeenCalledWith('123456');
      expect(otpManagerService.timeOutOtp).toHaveBeenCalled();
    });

    it('should return success false if OTP is invalid', async () => {
      jest.spyOn(otpManagerService, 'validateOtp').mockResolvedValue(false);

      const result = await service.validateOtp('123456');

      expect(result).toEqual({
        success: false,
        message: 'OTP is invalid or expired',
      });

      expect(otpManagerService.validateOtp).toHaveBeenCalledWith('123456');
      expect(otpManagerService.timeOutOtp).not.toHaveBeenCalled();
    });
  });

  describe('timeOut', () => {
    it('should timeout OTP after specified time', async () => {
      jest.spyOn(otpManagerService, 'timeOutOtp').mockResolvedValue(null);

      await service.timeOut();

      expect(otpManagerService.timeOutOtp).toHaveBeenCalled();
    });
  });
});
