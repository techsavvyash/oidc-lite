import { Test, TestingModule } from '@nestjs/testing';
import { LoginController } from './login.controller';
import { LoginService } from './login.service';
import { DataApplicationIdGuard } from '../guards/dataApplicationId.guard';
import { Response, Request } from 'express';
import { LoginDto } from './login.dto';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { HeaderAuthService } from '../header-auth/header-auth.service';
import { UtilsService } from '../utils/utils.service';

describe('LoginController', () => {
  let loginController: LoginController;
  let loginService: LoginService;

  const mockLoginService = {
    login: jest.fn().mockResolvedValue({
      access_token: 'testAccessToken',
      refresh_token: 'testRefreshToken',
    }),
    logout: jest.fn().mockResolvedValue({ message: 'Logged out' }),
  };

  const mockResponse = () => {
    const res = {} as Response;
    res.cookie = jest.fn().mockReturnValue(res);
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const mockRequest = () => {
    const req = {} as Request;
    return req;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoginController],
      providers: [
        {
          provide: LoginService,
          useValue: mockLoginService,
        },
        DataApplicationIdGuard,
        PrismaService,
        JwtService,
        HeaderAuthService,
        UtilsService
      ],
    }).compile();

    loginController = module.get<LoginController>(LoginController);
    loginService = module.get<LoginService>(LoginService);
  });

  it('should be defined', () => {
    expect(loginController).toBeDefined();
  });

  describe('login', () => {
    it('should log in a user and set cookies', async () => {
      const res = mockResponse();
      const headers = {};
      const loginDto: LoginDto = {
        loginId: 'testLoginId',
        password: 'testPassword',
        applicationId: 'testApplicationId',
        redirect_uri: 'testRedirectUri',
        scope: 'testScope',
        state: 'testState',
      };

      await loginController.login(loginDto, headers, res);

      expect(loginService.login).toHaveBeenCalledWith(loginDto, headers);
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'testRefreshToken',
        {
          secure: true,
          httpOnly: true,
        },
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'accessToken',
        'testAccessToken',
        {
          secure: true,
          httpOnly: true,
        },
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        access_token: 'testAccessToken',
        refresh_token: 'testRefreshToken',
      });
    });
  });

  describe('logout', () => {
    it('should log out a user', async () => {
      const res = mockResponse();
      const req = mockRequest();

      await loginController.logout(res, req);

      expect(loginService.logout).toHaveBeenCalledWith(res, req);
    });
  });
});
