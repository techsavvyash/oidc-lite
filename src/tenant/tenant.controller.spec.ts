import { Test, TestingModule } from '@nestjs/testing';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import * as crypto from 'crypto';

describe('TenantController', () => {
  let controller: TenantController;
  let service: TenantService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantController],
      providers: [
        {
          provide: TenantService,
          useValue: {
            createATenant: jest.fn(),
            returnAllTenants: jest.fn(),
            returnATenant: jest.fn(),
            updateATenant: jest.fn(),
            deleteATenant: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TenantController>(TenantController);
    service = module.get<TenantService>(TenantService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createATenantWithRandomUUID', () => {
    it('should call createATenant with random UUID', async () => {
      const headers = { authorization: 'token' };
      const createTenantDto = {
        name: 'TenantName',
        jwtConfiguration: {
          accessTokenSigningKeysID: 'access-key-id-123',
          refreshTokenTimeToLiveInMinutes: 1440,
          timeToLiveInSeconds: 3600,
          idTokenSigningKeysID: 'id-key-id-456',
        },
      };

      const id = 'a0f7c111-3b15-45bd-bd37-e86bfcb9a5fb';
      jest.spyOn(crypto, 'randomUUID').mockReturnValue(id);
      // Ensure randomUUID mock is working as expected
      expect(crypto.randomUUID()).toBe(id);
      await controller.createATenantWithRandomUUID(createTenantDto, headers);
      expect(service.createATenant).toHaveBeenCalledWith(
        id,
        createTenantDto,
        headers,
      );
    });
  });

  describe('returnAllTenants', () => {
    it('should call returnAllTenants', async () => {
      const headers = { authorization: 'token' };
      await controller.returnAllTenants(headers);
      expect(service.returnAllTenants).toHaveBeenCalledWith(headers);
    });
  });

  describe('returnATenant', () => {
    it('should call returnATenant', async () => {
      const id = 'test-id';
      const headers = { authorization: 'token' };
      await controller.returnATenant(id, headers);
      expect(service.returnATenant).toHaveBeenCalledWith(id, headers);
    });
  });

  describe('createATenant', () => {
    it('should call createATenant with specified ID', async () => {
      const createTenantDto = {
        name: 'TenantName',
        jwtConfiguration: {
          accessTokenSigningKeysID: 'access-key-id-123',
          refreshTokenTimeToLiveInMinutes: 1440,
          timeToLiveInSeconds: 3600,
          idTokenSigningKeysID: 'id-key-id-456',
        },
      };
      const id = 'test-id';
      const headers = { authorization: 'token' };
      await controller.createATenant(id, createTenantDto, headers);
      expect(service.createATenant).toHaveBeenCalledWith(
        id,
        createTenantDto,
        headers,
      );
    });
  });

  describe('updateATenant', () => {
    it('should call updateATenant', async () => {
      const id = 'test-id';
      const headers = { authorization: 'token' };
      const createTenantDto = {
        name: 'TenantName',
        jwtConfiguration: {
          accessTokenSigningKeysID: 'access-key-id-123',
          refreshTokenTimeToLiveInMinutes: 1440,
          timeToLiveInSeconds: 3600,
          idTokenSigningKeysID: 'id-key-id-456',
        },
      };
      await controller.updateATenant(id, createTenantDto, headers);
      expect(service.updateATenant).toHaveBeenCalledWith(
        id,
        createTenantDto,
        headers,
      );
    });
  });

  describe('deleteATenant', () => {
    it('should call deleteATenant', async () => {
      const id = 'test-id';
      const headers = { authorization: 'token' };
      await controller.deleteATenant(id, headers);
      expect(service.deleteATenant).toHaveBeenCalledWith(id, headers);
    });
  });
});

// UNIT TESTS: TENANT CONTROLLER
// -----------------------------
// Test 1: createATenantWithRandomUUID
// - It should call createATenant with random UUID
// - Mock the result of the service method createATenant
// - Call the controller method createATenantWithRandomUUID
// - Expect the service method createATenant to have been called with the expected arguments
//
// Test 2: returnAllTenants
// - It should call returnAllTenants
// - Mock the result of the service method returnAllTenants
// - Call the controller method returnAllTenants
// - Expect the service method returnAllTenants to have been called with the expected arguments

// Test 3: returnATenant
// - It should call returnATenant
// - Mock the result of the service method returnATenant
// - Call the controller method returnATenant
// - Expect the service method returnATenant to have been called with the expected arguments
//
// Test 4: createATenant
// - It should call createATenant with specified ID
// - Mock the result of the service method createATenant
// - Call the controller method createATenant
// - Expect the service method createATenant to have been called with the expected arguments
//
