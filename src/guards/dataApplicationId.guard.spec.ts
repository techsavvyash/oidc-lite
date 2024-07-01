import { Test, TestingModule } from '@nestjs/testing';
import { DataApplicationIdGuard } from './dataApplicationId.guard';
import { PrismaService } from '../prisma/prisma.service';
import { UtilsService } from '../utils/utils.service';
import { ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

describe('DataApplicationIdGuard', () => {
  let guard: DataApplicationIdGuard;
  let prismaService: PrismaService;
  let utilsService: UtilsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataApplicationIdGuard,
        {
          provide: PrismaService,
          useValue: {
            application: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: UtilsService,
          useValue: {
            checkHostPublicKeyWithSavedPublicKeys: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<DataApplicationIdGuard>(DataApplicationIdGuard);
    prismaService = module.get<PrismaService>(PrismaService);
    utilsService = module.get<UtilsService>(UtilsService);
  });

  const mockApplication = {
    id: 'app-id',
    accessTokenSigningKeysId: 'key-id',
    active: true,
    data: 'data',
    idTokenSigningKeysId: 'key-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    name: 'name',
    tenantId: 'tenant-id',
  };

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return false if no body is present', async () => {
    const mockExecutionContext: ExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {},
          hostname: 'testhost',
        }),
      }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(mockExecutionContext);
    expect(result).toBe(false);
  });

  it('should return false if no data is present', async () => {
    const mockExecutionContext: ExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {},
          hostname: 'testhost',
          body: {},
        }),
      }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(mockExecutionContext);
    expect(result).toBe(false);
  });

  it('should return false if no applicationId is present in data', async () => {
    const mockExecutionContext: ExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {},
          hostname: 'testhost',
          body: { data: {} },
        }),
      }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(mockExecutionContext);
    expect(result).toBe(false);
  });

  it('should return false if application is not found', async () => {
    jest.spyOn(prismaService.application, 'findUnique').mockResolvedValue(null);

    const mockExecutionContext: ExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {},
          hostname: 'testhost',
          body: { data: { applicationId: 'app-id' } },
        }),
      }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(mockExecutionContext);
    expect(result).toBe(false);
  });

  it('should return false if checkHostPublicKeyWithSavedPublicKeys returns false', async () => {
    jest
      .spyOn(prismaService.application, 'findUnique')
      .mockResolvedValue(mockApplication);
    jest
      .spyOn(utilsService, 'checkHostPublicKeyWithSavedPublicKeys')
      .mockResolvedValue(false);

    const mockExecutionContext: ExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { 'x-forwarded-host': 'forwardedhost' },
          hostname: 'testhost',
          body: { data: { applicationId: 'app-id' } },
        }),
      }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(mockExecutionContext);
    expect(result).toBe(false);
  });

  it('should return true if all checks pass', async () => {
    jest
      .spyOn(prismaService.application, 'findUnique')
      .mockResolvedValue(mockApplication);
    jest
      .spyOn(utilsService, 'checkHostPublicKeyWithSavedPublicKeys')
      .mockResolvedValue(true);

    const mockExecutionContext: ExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { 'x-forwarded-host': 'forwardedhost' },
          hostname: 'testhost',
          body: { data: { applicationId: 'app-id' } },
        }),
      }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(mockExecutionContext);
    expect(result).toBe(true);
  });
});
