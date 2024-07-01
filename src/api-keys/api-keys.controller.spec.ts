import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';
import { PrismaService } from '../prisma/prisma.service'; // Adjusted path
import { CreateApiKeyDto, UpdateApiKeyDto } from './apiKey.dto';
import { randomUUID } from 'crypto';

describe('ApiKeysController', () => {
  let apiKeysController: ApiKeysController;
  let apiKeysService: ApiKeysService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApiKeysController],
      providers: [
        {
          provide: ApiKeysService,
          useValue: {
            createAnApiKey: jest.fn(),
            returnAnApiKey: jest.fn(),
            updateAnApiKey: jest.fn(),
            deleteAnApiKey: jest.fn(),
          },
        },
        PrismaService, // Ensure PrismaService is provided
      ],
    }).compile();

    apiKeysController = module.get<ApiKeysController>(ApiKeysController);
    apiKeysService = module.get<ApiKeysService>(ApiKeysService);
  });

  describe('createAnApiKeyWithRandomUUID', () => {
    it('should create an API key with a random UUID', async () => {
      const result = {
        success: true,
        message: 'Api key successfully generated',
        data: {
          id: randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
          keyManager: true,
          keyValue: 'mockedKeyValue',
          permissions: 'mockpermission',
          metaData: 'mockedMetaData',
          tenantsId: 'mockedTenantsId',
        },
      };

      jest.spyOn(apiKeysService, 'createAnApiKey').mockResolvedValue(result);

      const createApiKeyDto: CreateApiKeyDto = {
        key: 'mockedKeyValue',
        permissions: {
          endpoints: [{ url: 'http://example.com', methods: 'GET' }],
        },
        metaData: 'mockedMetaData',
        tenantId: 'mockedTenantsId',
      };
      const headers = { authorization: 'Bearer token' };

      expect(
        await apiKeysController.createAnApiKeyWithRandomUUID(
          createApiKeyDto,
          headers,
        ),
      ).toBe(result);
      expect(apiKeysService.createAnApiKey).toHaveBeenCalledWith(
        expect.any(String),
        createApiKeyDto,
        headers,
      );
    });
  });

  describe('createAnApiKey', () => {
    it('should create an API key with the given UUID', async () => {
      const result = {
        success: true,
        message: 'Api key successfully generated',
        data: {
          id: randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
          keyManager: true,
          keyValue: 'mockedKeyValue',
          permissions: 'mockpermission',
          metaData: 'mockedMetaData',
          tenantsId: 'mockedTenantsId',
        },
      };

      jest.spyOn(apiKeysService, 'createAnApiKey').mockResolvedValue(result);

      const id = randomUUID();
      const createApiKeyDto: CreateApiKeyDto = {
        key: 'mockedKeyValue',
        permissions: {
          endpoints: [{ url: 'http://example.com', methods: 'GET' }],
        },
        metaData: 'mockedMetaData',
        tenantId: 'mockedTenantsId',
      };
      const headers = { authorization: 'Bearer token' };

      expect(
        await apiKeysController.createAnApiKey(id, createApiKeyDto, headers),
      ).toBe(result);
      expect(apiKeysService.createAnApiKey).toHaveBeenCalledWith(
        id,
        createApiKeyDto,
        headers,
      );
    });
  });

  describe('returnAnApiKey', () => {
    it('should return an API key by ID', async () => {
      const result = {
        success: true,
        message: 'Api key successfully returned',
        data: {
          id: randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
          keyManager: true,
          keyValue: 'mockedKeyValue',
          permissions: 'mockpermission',
          metaData: 'mockedMetaData',
          tenantsId: 'mockedTenantsId',
        },
      };

      jest.spyOn(apiKeysService, 'returnAnApiKey').mockResolvedValue(result);

      const id = randomUUID();
      const headers = { authorization: 'Bearer token' };

      expect(await apiKeysController.returnAnApiKey(id, headers)).toBe(result);
      expect(apiKeysService.returnAnApiKey).toHaveBeenCalledWith(id, headers);
    });
  });

  describe('updateAnApiKey', () => {
    it('should update an API key by ID', async () => {
      const result = {
        success: true,
        message: 'Key updated successfully',
        data: {
          id: randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
          keyManager: true,
          keyValue: 'mockedKeyValue',
          permissions: 'mockpermission',
          metaData: 'mockedMetaData',
          tenantsId: 'mockedTenantsId',
        },
      };

      jest.spyOn(apiKeysService, 'updateAnApiKey').mockResolvedValue(result);

      const id = randomUUID();
      const updateApiKeyDto: UpdateApiKeyDto = {
        key: 'mockedKeyValue',
        permissions: {
          endpoints: [{ url: 'http://example.com', methods: 'GET' }],
        },
        metaData: 'mockedMetaData',
      };
      const headers = { authorization: 'Bearer token' };

      expect(
        await apiKeysController.updateAnApiKey(id, updateApiKeyDto, headers),
      ).toBe(result);
      expect(apiKeysService.updateAnApiKey).toHaveBeenCalledWith(
        id,
        updateApiKeyDto,
        headers,
      );
    });
  });

  describe('deleteAnApiKey', () => {
    it('should delete an API key by ID', async () => {
      const result = {
        success: true,
        message: 'Api key successfully deleted',
        data: {
          id: randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
          keyManager: true,
          keyValue: 'mockedKeyValue',
          permissions: 'mockpermission',
          metaData: 'mockedMetaData',
          tenantsId: 'mockedTenantsId',
        },
      };

      jest.spyOn(apiKeysService, 'deleteAnApiKey').mockResolvedValue(result);

      const id = randomUUID();
      const headers = { authorization: 'Bearer token' };

      expect(await apiKeysController.deleteAnApiKey(id, headers)).toBe(result);
      expect(apiKeysService.deleteAnApiKey).toHaveBeenCalledWith(id, headers);
    });
  });
});

// API KEYS CONTROLLER: TESTS
// ---------------------------
// Test 1: createAnApiKeyWithRandomUUID
// - It should create an API key with a random UUID
// - Mock the result of the service method createAnApiKey
// - Call the controller method createAnApiKeyWithRandomUUID
// - Expect the result to be the mocked result
// - Expect the service method createAnApiKey to have been called with the expected arguments
//
// Test 2: createAnApiKey
// - It should create an API key with the given UUID
// - Mock the result of the service method createAnApiKey
// - Call the controller method createAnApiKey
// - Expect the result to be the mocked result
// - Expect the service method createAnApiKey to have been called with the expected arguments
//
// Test 3: returnAnApiKey
// - It should return an API key by ID
// - Mock the result of the service method returnAnApiKey
// - Call the controller method returnAnApiKey
// - Expect the result to be the mocked result
// - Expect the service method returnAnApiKey to have been called with the expected arguments
//
// Test 4: updateAnApiKey
// - It should update an API key by ID
// - Mock the result of the service method updateAnApiKey
// - Call the controller method updateAnApiKey
// - Expect the result to be the mocked result
// - Expect the service method updateAnApiKey to have been called with the expected arguments
//
// Test 5: deleteAnApiKey
// - It should delete an API key by ID
// - Mock the result of the service method deleteAnApiKey
// - Call the controller method deleteAnApiKey
// - Expect the result to be the mocked result
// - Expect the service method deleteAnApiKey to have been called with the expected arguments
