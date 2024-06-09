import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateTenantDto } from 'src/dto/tenant.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TenantService {
  private readonly logger: Logger;
  constructor(private readonly prismaService: PrismaService) {
    this.logger = new Logger(TenantService.name);
  }

  async createATenant(id: string, data: CreateTenantDto) {
    const oldTenant = await this.prismaService.tenant.findUnique({
      where: { id },
    });
    if (oldTenant) {
      throw new BadRequestException({
        message: 'Tenant with the given id already exists',
      });
    }
    if (!data || !data.jwtConfiguration || !data.name) {
      throw new BadRequestException({
        message:
          'Either no data given or data missing name and jwtConfiguration',
      });
    }
    const jwtConfiguration = data.jwtConfiguration;
    if (
      !jwtConfiguration ||
      !jwtConfiguration.accessTokenKeyID ||
      !jwtConfiguration.idTokenKeyID ||
      !jwtConfiguration.refreshTokenTimeToLiveInMinutes ||
      !jwtConfiguration.timeToLiveInSeconds
    ) {
      throw new BadRequestException({
        message: 'incomplete jwtConfiguration sent',
      });
    }
    
    const accessTokenSigningKeysId = jwtConfiguration.accessTokenKeyID;
    const idTokenSigningKeysId = jwtConfiguration.idTokenKeyID;
    const name = data.name;
    const additionalData = data.data ? JSON.stringify(data.data) : '';
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
        message: 'Tenant created successfully!',
        tenant,
      };
    } catch (error) {
      console.log('Error from createATenant', error);
      throw new InternalServerErrorException({
        message: 'Error creating new tenant',
      });
    }
  }

  async updateATenant(id: string, data: CreateTenantDto) {
    if (!id) {
      throw new BadRequestException({
        message: 'tenant id not given',
      });
    }
    if (!data) {
      throw new BadRequestException({
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
        message: 'tenant with the given id dont exists',
      });
    }

    const name = data.name ? data.name : oldTenant.name;
    const jwtConfiguration = data.jwtConfiguration
      ? data.jwtConfiguration
      : null;
    const accessTokenSigningKeysId = jwtConfiguration?.accessTokenKeyID
      ? jwtConfiguration.accessTokenKeyID
      : oldTenant.accessTokenSigningKeysId;
    const idTokenSigningKeysId = jwtConfiguration?.idTokenKeyID
      ? jwtConfiguration.idTokenKeyID
      : oldTenant.idTokenSigningKeysId;
    const additionalData = data.data
      ? JSON.stringify(data.data)
      : oldTenant.data;

    try {
      const tenant = await this.prismaService.tenant.update({
        where: { id },
        data: {
          name,
          accessTokenSigningKeysId,
          idTokenSigningKeysId,
          data: additionalData,
        },
      });
      return {
        message: 'Tenant updated successfully!',
        tenant,
      };
    } catch (error) {
      console.log('Error happend in updateATenant', this.updateATenant);
      throw new InternalServerErrorException({
        message: 'Error occured while updating the tenant',
      });
    }
  }

  async deleteATenant(id: string) {
    const tenant = await this.prismaService.tenant.delete({ where: { id } });
    return {
      message: 'Tenant deleted successfully!',
      tenant,
    };
  }

  async returnATenant(id: string) {
    return await this.prismaService.tenant.findUnique({ where: { id } });
  }

  async returnAllTenants() {
    return await this.prismaService.tenant.findMany();
  }

  // search for a tenant with given ids else creates a new tenant with given ids
  async findTenantElseCreate(
    accessTokenSigningKeysId: string,
    idTokenSigningKeysId: string,
    tenantId?: string,
    name?: string,
    data?: string,
  ) {
    if (accessTokenSigningKeysId && idTokenSigningKeysId) {
      const tenant = await this.prismaService.tenant.findFirst({
        where: {
          accessTokenSigningKeysId,
          idTokenSigningKeysId,
        },
      });
      if (tenant) {
        if ((tenantId && tenant.id === tenantId) || !tenantId) {
          return {
            message: 'tenant with the provided keys/id found',
            tenant,
          };
        }
      }
    }
    // creating new tenant if any of the ids not matched in existing tenants
    name = name ? name : randomUUID();
    const configurations = data ? data : 'Some default data if no given';
    const tenant_id = tenantId ? tenantId : randomUUID();
    accessTokenSigningKeysId = accessTokenSigningKeysId
      ? accessTokenSigningKeysId
      : randomUUID();
    idTokenSigningKeysId = idTokenSigningKeysId
      ? idTokenSigningKeysId
      : randomUUID();
    // find if keys exist for the given ids. else create keys using keysService
    // will fail since can't create keys till now
    try {
      const tenant = await this.prismaService.tenant.create({
        data: {
          id: tenant_id,
          accessTokenSigningKeysId,
          idTokenSigningKeysId,
          name,
          data: configurations,
        },
      });
      this.logger.log('New tenant created!', tenant);
      return {
        message: 'New tenant created!',
        tenant,
      };
    } catch (error) {
      console.log('Error creating tenant', error);
      throw new HttpException(
        'Error creating a new tenant!',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
