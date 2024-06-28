import { Test, TestingModule } from '@nestjs/testing';
import { OtpManagerService } from './otp-manager.service';

describe('OtpManagerService', () => {
  let service: OtpManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OtpManagerService],
    }).compile();

    service = module.get<OtpManagerService>(OtpManagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateOtp', () => {
    it('should generate a 6-digit OTP', async () => {
      const otp = await service.generateOtp();
      expect(otp).toHaveLength(6);
      expect(Number(otp)).toBeGreaterThanOrEqual(100000);
      expect(Number(otp)).toBeLessThanOrEqual(999999);
    });
  });

  describe('validateOtp', () => {
    it('should return true for a valid OTP', async () => {
      const otp = await service.generateOtp();
      const isValid = await service.validateOtp(otp);
      expect(isValid).toBe(true);
    });

    it('should return false for an invalid OTP', async () => {
      await service.generateOtp();
      const isValid = await service.validateOtp('123456');
      expect(isValid).toBe(false);
    });
  });

  describe('timeOutOtp', () => {
    it('should reset the OTP', async () => {
      await service.generateOtp();
      await service.timeOutOtp();
      const isValid = await service.validateOtp('000000');
      expect(isValid).toBe(false);
      expect(service.otp).toBe('');
    });
  });
});
