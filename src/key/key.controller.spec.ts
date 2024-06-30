// NO FILE ERRORS but TEST FAILS

import { Test, TestingModule } from '@nestjs/testing';
import { KeyController } from './key.contoller';
import { KeyService } from './key.service';
import { generateKeyDTO, updateDTO } from './key.dto';
import { randomUUID } from 'crypto';

describe('KeyController', () => {
  let keyController: KeyController;
  let keyService: KeyService;

  const mockResult = [
    {
      id: '1',
      algorithm: 'RS256',
      certificate: 'mockCertificate1',
      expiry: 1681942800, // example UNIX timestamp
      createdAt: new Date('2023-01-01T00:00:00Z'),
      issuer: 'Issuer1',
      kid: 'kid1',
      updatedAt: new Date('2023-06-01T00:00:00Z'),
      name: 'KeyName1',
      privateKey: 'mockPrivateKey1',
      publicKey: 'mockPublicKey1',
      secret: 'mockSecret1',
      type: 'RSA',
    },
  ];
  const mockResponse = {
    success: true,
    message: 'all keys retrieved',
    data: mockResult,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KeyController],
      providers: [
        {
          provide: KeyService,
          useValue: {
            retrieveAllKey: jest.fn(),
            retrieveUniqueKey: jest.fn(),
            updateKey: jest.fn(),
            deleteKey: jest.fn(),
            generateKey: jest.fn(),
          },
        },
      ],
    }).compile();

    keyController = module.get<KeyController>(KeyController);
    keyService = module.get<KeyService>(KeyService);
  });

  describe('retrieveAllKey', () => {
    it('should call retrieveAllKey method from KeyService', async () => {
      jest.spyOn(keyService, 'retrieveAllKey').mockResolvedValue(mockResponse);

      expect(
        await keyController.retrieveAllKey({ authorization: 'Bearer token' }),
      ).toBe(mockResponse);
      expect(keyService.retrieveAllKey).toHaveBeenCalledWith({
        authorization: 'Bearer token',
      });
    });
  });

  describe('retrieveUniqueKey', () => {
    it('should call retrieveUniqueKey method from KeyService', async () => {
      jest.spyOn(keyService, 'retrieveUniqueKey').mockResolvedValue({
        success: true,
        message: 'key retrieved',
        data: mockResult[0],
      });

      expect(
        await keyController.retrieveUniqueKey('1', {
          authorization: 'Bearer token',
        }),
      ).toStrictEqual({
        success: true,
        message: 'key retrieved',
        data: mockResult[0],
      });
      expect(keyService.retrieveUniqueKey).toHaveBeenCalledWith('1', {
        authorization: 'Bearer token',
      });
    });
  });

  describe('udpatingKey', () => {
    it('should call updateKey method from KeyService', async () => {
      const updateDto: updateDTO = { name: 'updated name' };
      jest.spyOn(keyService, 'updateKey').mockResolvedValue({
        success: true,
        message: 'key retrieved',
        data: mockResult[0],
      });

      expect(
        await keyController.udpatingKey('1', updateDto, {
          authorization: 'Bearer token',
        }),
      ).toStrictEqual({
        success: true,
        message: 'key retrieved',
        data: mockResult[0],
      });
      expect(keyService.updateKey).toHaveBeenCalledWith('1', updateDto, {
        authorization: 'Bearer token',
      });
    });
  });

  describe('deletingKey', () => {
    it('should call deleteKey method from KeyService', async () => {
      jest.spyOn(keyService, 'deleteKey').mockResolvedValue({
        success: true,
        message: 'key retrieved',
        data: mockResult[0],
      });

      expect(
        await keyController.deletingKey('1', { authorization: 'Bearer token' }),
      ).toStrictEqual({
        success: true,
        message: 'key retrieved',
        data: mockResult[0],
      });
      expect(keyService.deleteKey).toHaveBeenCalledWith('1', {
        authorization: 'Bearer token',
      });
    });
  });

  describe('randomgenerateKey', () => {
    it('should call generateKey method from KeyService with random UUID', async () => {
      const mockGenerateDto: generateKeyDTO = {
        algorithm: 'RSA',
        issuer: 'Issuer1',
        name: 'KeyName1',
        length: '2048',
      };
      jest.spyOn(keyService, 'generateKey').mockResolvedValue({
        success: true,
        message: 'key retrieved',
        data: 'jkws', //actually it is jkws: any
        key: mockResult[0],
      });

      const uuid = randomUUID();
      expect(
        await keyController.randomgenerateKey(mockGenerateDto, {
          authorization: 'Bearer token',
        }),
      ).toStrictEqual({
        success: true,
        message: 'key retrieved',
        data: 'jkws', //actually it is jkws: any
        key: mockResult[0],
      });
      expect(keyService.generateKey).toHaveBeenCalledWith(
        expect.any(String),
        mockGenerateDto,
        { authorization: 'Bearer token' },
      );
    });
  });

  describe('generateKey', () => {
    it('should call generateKey method from KeyService with provided UUID', async () => {
      const mockGenerateDto: generateKeyDTO = {
        algorithm: 'RSA',
        issuer: 'Issuer1',
        name: 'KeyName1',
        length: '2048',
      };
      jest.spyOn(keyService, 'generateKey').mockResolvedValue({
        success: true,
        message: 'key retrieved',
        data: 'jkws', //actually it is jkws: any
        key: mockResult[0],
      });

      const uuid = randomUUID();
      expect(
        await keyController.generateKey(uuid, mockGenerateDto, {
          authorization: 'Bearer token',
        }),
      ).toStrictEqual({
        success: true,
        message: 'key retrieved',
        data: 'jkws', //actually it is jkws: any
        key: mockResult[0],
      });
      expect(keyService.generateKey).toHaveBeenCalledWith(
        uuid,
        mockGenerateDto,
        {
          authorization: 'Bearer token',
        },
      );
    });
  });
});

// UNIT TESTS: KEY CONTROLLER
// ---------------------------
// Test Suite: KeyController
//  Test-1 retrieveAllKey
//      - should call retrieveAllKey method from KeyService
//  Test-2 retrieveUniqueKey
//      - should call retrieveUniqueKey method from KeyService
//  Test-3 udpatingKey
//      - should call updateKey method from KeyService
//  Test-4 deletingKey
//      - should call deleteKey method from KeyService
//  Test-5 randomgenerateKey
//      - should call generateKey method from KeyService with random UUID
//  Test-6 generateKey
//      - should call generateKey method from KeyService with provided UUID
