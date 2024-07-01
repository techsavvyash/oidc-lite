import { Test, TestingModule } from '@nestjs/testing';
import { KeyController } from './key.contoller';
import { KeyService } from './key.service';
import { generateKeyDTO, updateDTO } from './key.dto';
import { randomUUID } from 'crypto';
import { mock } from 'node:test';

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
      data: 'exampleData',
    },
  ];

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
      const mockHeaders = { authorization: 'Bearer token' };
      const mockResponse = {
        success: true,
        message: 'all keys retrieved',
        data: mockResult,
      };
      jest.spyOn(keyService, 'retrieveAllKey').mockResolvedValue(mockResponse);

      expect(await keyController.retrieveAllKey(mockHeaders)).toBe(
        mockResponse,
      );
      expect(keyService.retrieveAllKey).toHaveBeenCalledWith(mockHeaders);
    });
  });

  describe('retrieveUniqueKey', () => {
    it('should call retrieveUniqueKey method from KeyService', async () => {
      const mockId = '1';
      const mockHeaders = { authorization: 'Bearer token' };
      const mockResponse = {
        success: true,
        message: 'key retrieved',
        data: mockResult[0],
      };
      jest
        .spyOn(keyService, 'retrieveUniqueKey')
        .mockResolvedValue(mockResponse);

      expect(await keyController.retrieveUniqueKey(mockId, mockHeaders)).toBe(
        mockResponse,
      );
      expect(keyService.retrieveUniqueKey).toHaveBeenCalledWith(
        mockId,
        mockHeaders,
      );
    });
  });

  describe('udpatingKey', () => {
    it('should call updateKey method from KeyService', async () => {
      const mockId = '1';
      const mockUpdateDto: updateDTO = { name: 'updated name' };
      const mockHeaders = { authorization: 'Bearer token' };
      const mockResponse = { success: true, message: 'key updated', data: mockResult[0] };
      jest.spyOn(keyService, 'updateKey').mockResolvedValue(mockResponse);

      expect(
        await keyController.udpatingKey(mockId, mockUpdateDto, mockHeaders),
      ).toBe(mockResponse);
      expect(keyService.updateKey).toHaveBeenCalledWith(
        mockId,
        mockUpdateDto,
        mockHeaders,
      );
    });
  });

  describe('deletingKey', () => {
    it('should call deleteKey method from KeyService', async () => {
      const mockId = '1';
      const mockHeaders = { authorization: 'Bearer token' };
      const mockResponse = { success: true, message: 'key deleted', data: mockResult[0] };
      jest.spyOn(keyService, 'deleteKey').mockResolvedValue(mockResponse);

      expect(await keyController.deletingKey(mockId, mockHeaders)).toBe(
        mockResponse,
      );
      expect(keyService.deleteKey).toHaveBeenCalledWith(mockId, mockHeaders);
    });
  });

  describe('randomgenerateKey', () => {
    it('should call generateKey method from KeyService with random UUID', async () => {
      const mockGenerateDto: generateKeyDTO = {
        algorithm: 'RSA',
        issuer: 'Issuer1',
        name: 'KeyName1',
        length: 2048,
      };
      const mockHeaders = { authorization: 'Bearer token' };
      const mockResponse = {
        success: true,
        message: 'key generated',
        data: 'jkws', //actually it is jkws: any
        key: mockResult[0],
      };
      jest.spyOn(keyService, 'generateKey').mockResolvedValue(mockResponse);

      const uuid = randomUUID();
      expect(
        await keyController.randomgenerateKey(mockGenerateDto, mockHeaders),
      ).toStrictEqual(mockResponse);
      expect(keyService.generateKey).toHaveBeenCalledWith(
        expect.any(String),
        mockGenerateDto,
        mockHeaders,
      );
    });
  });

  describe('generateKey', () => {
    it('should call generateKey method from KeyService with provided UUID', async () => {
      const mockId = '1';
      const mockGenerateDto: generateKeyDTO = {
        algorithm: 'RSA',
        issuer: 'Issuer1',
        name: 'KeyName1',
        length: 2048,
      };
      const mockHeaders = { authorization: 'Bearer token' };
      const mockResponse = {
        success: true,
        message: 'key generated',
        data: 'jkws', //actually it is jkws: any
        key: mockResult[0],
      };
      jest.spyOn(keyService, 'generateKey').mockResolvedValue(mockResponse);

      expect(
        await keyController.generateKey(mockId, mockGenerateDto, mockHeaders),
      ).toStrictEqual(mockResponse);
      expect(keyService.generateKey).toHaveBeenCalledWith(
        mockId,
        mockGenerateDto,
        mockHeaders,
      );
    });
  });
});
