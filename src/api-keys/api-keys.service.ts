import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateApiKeyDto, UpdateApiKeyDto } from 'src/dto/apiKey.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ApiKeysService {
  private readonly logger: Logger;

  constructor(private readonly prismaService: PrismaService) {
    this.logger = new Logger();
  }

  async createAnApiKey(id: string, data: CreateApiKeyDto) {
    if (!id) {
      throw new BadRequestException({
        message: 'No id give to create an api key',
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
    const tenantsId = data.permissions?.tenantId
      ? data.permissions?.tenantId
      : null; // null implies a key with scope of all the tenants
    const metaData = data.metaData ? JSON.stringify(data.metaData) : null;
    const permissions = data.permissions
      ? JSON.stringify(data.permissions)
      : null; // null implies all endpoints and all the methods
    const keyManager = false; // the value can't be changed from this route. Also these routes need to be protected from an api key with keyManager = true. Will need to hardcode one of the keys to run this route
    const keyValue = data.key ? data.key : randomUUID();
    try {
      const apiKey = await this.prismaService.authenticationKey.create({
        data: {
          keyValue,
          keyManager,
          permissions,
          tenantsId,
          metaData,
        },
      });
      this.logger.log('New api Key generated', apiKey);
      return {
        message: 'Api key successfully generated',
        apiKey,
      };
    } catch (error) {
      console.log('Error from createAnApiKey', error);
      throw new InternalServerErrorException({
        message: 'Some internal server error occured while creating the apikey',
      });
    }
  }
  async returnAnApiKey(id: string) {
    if (!id) {
      throw new BadRequestException({
        message: 'No id given',
      });
    }
    const apiKey = await this.prismaService.authenticationKey.findUnique({
      where: { id },
    });
    if (!apiKey) {
      throw new BadRequestException({
        message: 'No apiKey exists for the given id',
      });
    }
    return {
      apiKey,
    };
  }
  async updateAnApiKey(id: string, data: UpdateApiKeyDto) {
    if (!id) {
      throw new BadRequestException({
        message: 'No id give to update the api key',
      });
    }
    if (!data) {
      throw new BadRequestException({
        message: 'No data given to update the api key',
      });
    }
    const oldApiKey = await this.prismaService.authenticationKey.findUnique({
      where: { id },
    });
    if (!oldApiKey) {
      throw new BadRequestException({
        message: 'Api key with the given id dont exist',
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
        message: 'Key updated successfully',
        apiKey,
      };
    } catch (error) {
      console.log('Error occured in UpdateAnApiKey', error);
      throw new InternalServerErrorException({
        message: 'some error occured while updating the key',
      });
    }
  }
  async deleteAnApiKey(id: string) {
    if (!id) {
      throw new BadRequestException({
        message: 'No apiKey exists for the given id',
      });
    }
    try {
      const apiKey = await this.prismaService.authenticationKey.delete({
        where: { id },
      });
      this.logger.log('An api key is deleted!', apiKey);
      return {
        message: 'successfully deleted apiKey',
        apiKey,
      };
    } catch (error) {
      console.log('Error from deleteAnApiKey', error);
      throw new InternalServerErrorException({
        message:
          'Some unexpected internal server error occured while deleting the key',
      });
    }
  }
}
