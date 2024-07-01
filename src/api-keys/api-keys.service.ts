import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateApiKeyDto, UpdateApiKeyDto } from './apiKey.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApiKeysService {
  private readonly logger: Logger;

  constructor(private readonly prismaService: PrismaService) {
    this.logger = new Logger(ApiKeysService.name);
  }

  async createAnApiKey(id: string, data: CreateApiKeyDto, headers: object) {
    const token = headers['authorization'];
    if (!token) {
      throw new BadRequestException({
        message: 'Authorization header required',
      });
    }
    const headerKey = await this.prismaService.authenticationKey.findUnique({
      where: {
        keyValue: token,
      },
    });
    if (!headerKey || !headerKey.keyManager) {
      throw new UnauthorizedException({
        message: 'You are not authorized enough',
      });
    }
    if (!id) {
      throw new BadRequestException({
        message: 'No id given. Give an id to create an api key',
      });
    }
    const key = await this.prismaService.authenticationKey.findUnique({
      where: { id },
    });
    if (key) {
      throw new BadRequestException({
        success: false,
        message: 'Authentication key with given id already exists',
      });
    }
    if (!data) {
      throw new BadRequestException({
        message: 'No data given to create an api key',
      });
    }
    const existingApiKey =
      await this.prismaService.authenticationKey.findUnique({ where: { id } });
    if (existingApiKey) {
      throw new BadRequestException({
        message: 'key with the provided id cant be created',
      });
    }
    const tenantsId = data.tenantId; // null implies a key with scope of all the tenants
    if (tenantsId) {
      const tenant = await this.prismaService.tenant.findUnique({
        where: { id: tenantsId },
      });
      if (!tenant) {
        throw new BadRequestException({
          success: false,
          message: 'The tenant with given tenant id dont exists',
        });
      }
    }
    const metaData = data.metaData ? JSON.stringify(data.metaData) : null;
    const permissions = data.permissions
      ? JSON.stringify(data.permissions)
      : null; // null implies all endpoints and all the methods
    const keyManager = false; // the value can't be changed from this route. Also these routes need to be protected from an api key with keyManager = true. Will need to hardcode one of the keys to run this route
    const keyValue = data.key ? data.key : randomUUID();
    try {
      const apiKey = await this.prismaService.authenticationKey.create({
        data: {
          id,
          keyValue,
          keyManager,
          permissions,
          tenantsId,
          metaData,
        },
      });
      this.logger.log('New api Key generated', apiKey);
      return {
        success: true,
        message: 'Api key successfully generated',
        data: apiKey,
      };
    } catch (error) {
      this.logger.log('Error from createAnApiKey', error);
      throw new InternalServerErrorException({
        success: false,
        message: 'Some internal server error occured while creating the apikey',
      });
    }
  }

  async returnAnApiKey(id: string, headers: object) {
    const token = headers['authorization'];
    if (!token) {
      throw new BadRequestException({
        success: false,
        message: 'Authorization header required',
      });
    }
    const headerKey = await this.prismaService.authenticationKey.findUnique({
      where: {
        keyValue: token,
      },
    });
    if (!headerKey) {
      throw new UnauthorizedException({
        success: false,
        message: 'You are not authorized enough',
      });
    }
    if (!id) {
      throw new BadRequestException({
        success: false,
        message: 'No id given',
      });
    }
    const apiKey = await this.prismaService.authenticationKey.findUnique({
      where: { id },
    });
    if (!apiKey) {
      throw new BadRequestException({
        success: false,
        message: 'No apiKey exists for the given id',
      });
    }
    if (
      !headerKey.keyManager &&
      headerKey.tenantsId !== apiKey.tenantsId &&
      headerKey.tenantsId !== null
    ) {
      // key should be level equal or higher
      throw new UnauthorizedException({
        success: false,
        message: 'You are not authorized enough',
      });
    }
    return {
      success: true,
      message: 'Found the requested key',
      data: apiKey,
    };
  }

  async updateAnApiKey(id: string, data: UpdateApiKeyDto, headers: object) {
    const token = headers['authorization'];
    if (!token) {
      throw new BadRequestException({
        success: false,
        message: 'Authorization header required',
      });
    }
    const headerKey = await this.prismaService.authenticationKey.findUnique({
      where: {
        keyValue: token,
      },
    });
    if (!headerKey) {
      throw new UnauthorizedException({
        success: false,
        message: 'You are not authorized enough',
      });
    }
    if (!id) {
      throw new BadRequestException({
        success: false,
        message: 'No id give to update the api key',
      });
    }
    if (!data) {
      throw new BadRequestException({
        success: false,
        message: 'No data given to update the api key',
      });
    }
    const oldApiKey = await this.prismaService.authenticationKey.findUnique({
      where: { id },
    });
    if (!oldApiKey) {
      throw new BadRequestException({
        success: false,
        message: 'Api key with the given id dont exist',
      });
    }
    if (
      !headerKey.keyManager &&
      headerKey.tenantsId !== oldApiKey.tenantsId &&
      headerKey.tenantsId !== null
    ) {
      // key should be level equal or higher
      throw new UnauthorizedException({
        success: false,
        message: 'You are not authorized enough',
      });
    }
    const permissions = data.permissions
      ? JSON.stringify(data.permissions)
      : oldApiKey.permissions;
    const metaData = data.metaData
      ? JSON.stringify(data.metaData)
      : oldApiKey.metaData;
    const keyValue = data.key ? data.key : oldApiKey.keyValue;

    try {
      const apiKey = await this.prismaService.authenticationKey.update({
        where: { id },
        data: {
          permissions,
          metaData,
          keyValue,
        },
      });
      this.logger.log('Api key updated', apiKey);
      return {
        success: true,
        message: 'Key updated successfully',
        data: apiKey,
      };
    } catch (error) {
      this.logger.log('Error occured in UpdateAnApiKey', error);
      throw new InternalServerErrorException({
        success: false,
        message: 'some error occured while updating the key',
      });
    }
  }

  async deleteAnApiKey(id: string, headers: object) {
    const token = headers['authorization'];
    if (!token) {
      throw new BadRequestException({
        success: false,
        message: 'Authorization header required',
      });
    }
    const headerKey = await this.prismaService.authenticationKey.findUnique({
      where: {
        keyValue: token,
      },
    });
    if (!headerKey) {
      throw new UnauthorizedException({
        success: false,
        message: 'You are not authorized enough',
      });
    }
    if (!id) {
      throw new BadRequestException({
        success: false,
        message: 'No apiKey exists for the given id',
      });
    }
    const apiKeyBeforeDel =
      await this.prismaService.authenticationKey.findUnique({
        where: { id },
      });
    if (
      !headerKey.keyManager &&
      headerKey.tenantsId !== apiKeyBeforeDel.tenantsId &&
      headerKey.tenantsId !== null
    ) {
      // key should be level equal or higher
      throw new UnauthorizedException({
        success: false,
        message: 'You are not authorized enough',
      });
    }
    const apiKey = await this.prismaService.authenticationKey.delete({
      where: { id },
    });
    this.logger.log('An api key is deleted!', apiKey);
    return {
      success: true,
      message: 'successfully deleted apiKey',
      data: apiKey,
    };
  }
}
