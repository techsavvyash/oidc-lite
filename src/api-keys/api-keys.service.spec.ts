// TODO: Have errors

import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeysService } from './api-keys.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

describe('ApiKeysService', () => {
  let service: ApiKeysService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeysService,
        { provide: PrismaService, useValue: jest.fn() },
      ],
    }).compile();

    service = module.get<ApiKeysService>(ApiKeysService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('createAnApiKey', () => {
    it('should throw BadRequestException if authorization header is missing', async () => {
      await expect(
        service.createAnApiKey(
          'id',
          { key: 'key', permissions: { endpoints: [] } },
          {},
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if the key manager is not found or is unauthorized', async () => {
      jest
        .spyOn(prismaService.authenticationKey, 'findUnique')
        .mockResolvedValue(null);

      await expect(
        service.createAnApiKey(
          'id',
          { key: 'key', permissions: { endpoints: [] } },
          { authorization: 'token' },
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if id is not provided', async () => {
      jest
        .spyOn(prismaService.authenticationKey, 'findUnique')
        .mockResolvedValue({ keyManager: true });

      await expect(
        service.createAnApiKey(
          null,
          { key: 'key', permissions: { endpoints: [] } },
          { authorization: 'token' },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if the key already exists', async () => {
      jest
        .spyOn(prismaService.authenticationKey, 'findUnique')
        .mockResolvedValue({ keyManager: true });

      await expect(
        service.createAnApiKey(
          'id',
          { key: 'key', permissions: { endpoints: [] } },
          { authorization: 'token' },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create an API key successfully', async () => {
      jest
        .spyOn(prismaService.authenticationKey, 'findUnique')
        .mockResolvedValueOnce({ keyManager: true });
      jest
        .spyOn(prismaService.authenticationKey, 'findUnique')
        .mockResolvedValueOnce(null);
      jest
        .spyOn(prismaService.authenticationKey, 'create')
        .mockResolvedValue({ id: 'id' });

      const result = await service.createAnApiKey(
        'id',
        { key: 'key', permissions: { endpoints: [] } },
        { authorization: 'token' },
      );

      expect(result).toEqual({
        success: true,
        message: 'Api key successfully generated',
        data: { id: 'id' },
      });
    });
  });

  describe('returnAnApiKey', () => {
    it('should throw BadRequestException if authorization header is missing', async () => {
      await expect(service.returnAnApiKey('id', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException if the key manager is not found or is unauthorized', async () => {
      jest
        .spyOn(prismaService.authenticationKey, 'findUnique')
        .mockResolvedValue(null);

      await expect(
        service.returnAnApiKey('id', { authorization: 'token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return an API key successfully', async () => {
      jest
        .spyOn(prismaService.authenticationKey, 'findUnique')
        .mockResolvedValue({ keyManager: true, tenantsId: null });
      jest
        .spyOn(prismaService.authenticationKey, 'findUnique')
        .mockResolvedValue({ id: 'id', tenantsId: null });

      const result = await service.returnAnApiKey('id', {
        authorization: 'token',
      });

      expect(result).toEqual({
        success: true,
        message: 'Found the requested key',
        data: { id: 'id', tenantsId: null },
      });
    });
  });

  describe('updateAnApiKey', () => {
    it('should throw BadRequestException if authorization header is missing', async () => {
      await expect(service.updateAnApiKey('id', {}, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException if the key manager is not found or is unauthorized', async () => {
      jest
        .spyOn(prismaService.authenticationKey, 'findUnique')
        .mockResolvedValue(null);

      await expect(
        service.updateAnApiKey('id', {}, { authorization: 'token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should update an API key successfully', async () => {
      jest
        .spyOn(prismaService.authenticationKey, 'findUnique')
        .mockResolvedValue({ keyManager: true, tenantsId: null });
      jest
        .spyOn(prismaService.authenticationKey, 'findUnique')
        .mockResolvedValue({ id: 'id', tenantsId: null });
      jest
        .spyOn(prismaService.authenticationKey, 'update')
        .mockResolvedValue({ id: 'id' });

      const result = await service.updateAnApiKey(
        'id',
        {},
        { authorization: 'token' },
      );

      expect(result).toEqual({
        success: true,
        message: 'Key updated successfully',
        data: { id: 'id' },
      });
    });
  });

  describe('deleteAnApiKey', () => {
    it('should throw BadRequestException if authorization header is missing', async () => {
      await expect(service.deleteAnApiKey('id', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException if the key manager is not found or is unauthorized', async () => {
      jest
        .spyOn(prismaService.authenticationKey, 'findUnique')
        .mockResolvedValue(null);

      await expect(
        service.deleteAnApiKey('id', { authorization: 'token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should delete an API key successfully', async () => {
      jest
        .spyOn(prismaService.authenticationKey, 'findUnique')
        .mockResolvedValue({ keyManager: true, tenantsId: null });
      jest
        .spyOn(prismaService.authenticationKey, 'delete')
        .mockResolvedValue({ id: 'id' });

      const result = await service.deleteAnApiKey('id', {
        authorization: 'token',
      });

      expect(result).toEqual({
        success: true,
        message: 'successfully deleted apiKey',
        data: { id: 'id' },
      });
    });
  });
});
