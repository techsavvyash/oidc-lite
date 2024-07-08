import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ResponseTenantDto, ResponseDto } from '../dto/response.dto';
import { CreateTenantDto, UpdateTenantDto } from './tenant.dto';
import { HeaderAuthService } from '../header-auth/header-auth.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantService {
  private readonly logger: Logger;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly headerAuthService: HeaderAuthService,
  ) {
    this.logger = new Logger(TenantService.name);
  }

  async createATenant(
    id: string,
    data: CreateTenantDto,
    headers: object,
  ): Promise<ResponseTenantDto> {
    // only tenant scoped api key can make new tenants
    const valid = await this.headerAuthService.authorizationHeaderVerifier(
      headers,
      null,
      '/tenant',
      'POST',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: valid.success,
        message: valid.message,
      });
    }
    if (!id) {
      throw new BadRequestException({
        success: false,
        message: 'Id not provided',
      });
    }
    const oldTenant = await this.prismaService.tenant.findUnique({
      where: { id },
    });
    if (oldTenant) {
      throw new BadRequestException({
        success: false,
        message: 'Tenant with the given id already exists',
      });
    }
    if (!data || !data.jwtConfiguration || !data.name) {
      throw new BadRequestException({
        success: false,
        message:
          'Either no data given or data missing name and jwtConfiguration',
      });
    }
    const jwtConfiguration = data.jwtConfiguration;
    if (
      !jwtConfiguration ||
      !jwtConfiguration.accessTokenSigningKeysID ||
      !jwtConfiguration.idTokenSigningKeysID ||
      !jwtConfiguration.refreshTokenTimeToLiveInMinutes ||
      !jwtConfiguration.timeToLiveInSeconds
    ) {
      throw new BadRequestException({
        success: false,
        message: 'incomplete jwtConfiguration sent',
      });
    }

    const accessTokenSigningKeysId = jwtConfiguration.accessTokenSigningKeysID;
    const idTokenSigningKeysId = jwtConfiguration.idTokenSigningKeysID;
    const idTokenSigningKey = await this.prismaService.key.findUnique({
      where: { id: idTokenSigningKeysId },
    });
    const accessTokenSigningKey = await this.prismaService.key.findUnique({
      where: { id: accessTokenSigningKeysId },
    });
    if (!idTokenSigningKey || !accessTokenSigningKey) {
      throw new BadRequestException({
        success: false,
        message: 'Either one of signingKeys dont exists',
      });
    }
    const name = data.name;
    const additionalData = JSON.stringify(data.jwtConfiguration);
    try {
      const tenant = await this.prismaService.tenant.create({
        data: {
          id,
          accessTokenSigningKeysId,
          idTokenSigningKeysId,
          name,
          data: additionalData,
        },
      });
      this.logger.log('New tenant created!', tenant);
      return {
        success: true,
        message: 'Tenant created successfully!',
        data: tenant,
      };
    } catch (error) {
      this.logger.log('Error from createATenant', error);
      throw new InternalServerErrorException({
        success: false,
        message: 'Error creating new tenant',
      });
    }
  }

  async updateATenant(
    id: string,
    data: UpdateTenantDto,
    headers: object,
  ): Promise<ResponseTenantDto> {
    const valid = await this.headerAuthService.authorizationHeaderVerifier(
      headers,
      id,
      '/tenant',
      'PATCH',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: false,
        message: valid.message,
      });
    }
    if (!id) {
      throw new BadRequestException({
        success: false,
        message: 'tenant id not given',
      });
    }
    if (!data) {
      throw new BadRequestException({
        success: false,
        message: 'No data given to update the tenant',
      });
    }
    const oldTenant = await this.prismaService.tenant.findUnique({
      where: {
        id,
      },
    });
    if (!oldTenant) {
      throw new BadRequestException({
        success: false,
        message: 'tenant with the given id dont exists',
      });
    }

    const name = data.name ? data.name : oldTenant.name;
    // const jwtConfiguration = data.jwtConfiguration
    //   ? data.jwtConfiguration
    //   : null;
    // const accessTokenSigningKeysId = jwtConfiguration?.accessTokenSigningKeysID
    //   ? jwtConfiguration.accessTokenSigningKeysID
    //   : oldTenant.accessTokenSigningKeysId;
    // const idTokenSigningKeysId = jwtConfiguration?.idTokenSigningKeysID
    //   ? jwtConfiguration.idTokenSigningKeysID
    //   : oldTenant.idTokenSigningKeysId;
    const additionalData = data.data
      ? JSON.stringify(data.data)
      : oldTenant.data;

    try {
      const tenant = await this.prismaService.tenant.update({
        where: { id },
        data: {
          name,
          data: additionalData,
        },
      });
      return {
        success: true,
        message: 'Tenant updated successfully!',
        data: tenant,
      };
    } catch (error) {
      this.logger.log('Error happend in updateATenant', this.updateATenant);
      throw new InternalServerErrorException({
        success: false,
        message: 'Error occured while updating the tenant',
      });
    }
  }

  async deleteATenant(id: string, headers: object): Promise<ResponseTenantDto> {
    const valid = await this.headerAuthService.authorizationHeaderVerifier(
      headers,
      id,
      '/tenant',
      'DELETE',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: false,
        message: valid.message,
      });
    }
    if (!id) {
      throw new BadRequestException({
        success: false,
        message: 'tenant id not given',
      });
    }
    const oldTenant = await this.prismaService.tenant.findUnique({
      where: { id },
    });
    if (!oldTenant) {
      throw new BadRequestException({
        success: false,
        message: 'No tenant with given id exists',
      });
    }
    const tenant = await this.prismaService.tenant.delete({
      where: { ...oldTenant },
    });
    return {
      success: true,
      message: 'Tenant deleted successfully!',
      data: tenant,
    };
  }

  async returnATenant(id: string, headers: object): Promise<ResponseTenantDto> {
    const valid = await this.headerAuthService.authorizationHeaderVerifier(
      headers,
      id,
      '/tenant',
      'GET',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: false,
        message: valid.message,
      });
    }
    if (!id) {
      throw new BadRequestException({
        success: false,
        message: 'tenant id not given',
      });
    }
    const tenant = await this.prismaService.tenant.findUnique({
      where: { id },
    });
    if (!tenant) {
      throw new BadRequestException({
        succcess: false,
        message: 'No such tenant exists',
      });
    }
    return {
      success: true,
      message: 'Tenant found successfully',
      data: tenant,
    };
  }

  async returnAllTenants(headers: object): Promise<ResponseDto> {
    const valid = await this.headerAuthService.authorizationHeaderVerifier(
      headers,
      null,
      '/tenant',
      'GET',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: false,
        message: valid.message,
      });
    }
    const tenants = await this.prismaService.tenant.findMany();
    return {
      success: true,
      message: 'These are all the tenants',
      data: tenants,
    };
  }
}
