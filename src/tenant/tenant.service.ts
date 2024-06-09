import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Permissions } from 'src/dto/apiKey.dto';
import { ResponseDto } from 'src/dto/response.dto';
import { CreateTenantDto } from 'src/dto/tenant.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TenantService {
  private readonly logger: Logger;
  constructor(private readonly prismaService: PrismaService) {
    this.logger = new Logger(TenantService.name);
  }

  async authorizationHeaderVerifier(headers: object, id: string, requestedUrl: string, requestedMethod: string): Promise<ResponseDto> {
    const token = headers['authorization'];
    if (!token) {
      return{
        success: false,
        message: "authorization header required"
      }
    }
    const headerKey = await this.prismaService.authenticationKey.findUnique({
      where: {
        keyValue: token,
      },
    });
    if (!headerKey) {
      return{
        success: false,
        message: "You are not authorized"
      }
    }
    const permissions: Permissions = JSON.parse(headerKey.permissions);
    let allowed = permissions ? false: true;
    if(permissions){
      if(permissions.endpoints){
        permissions.endpoints.forEach((val) => {
          allowed = (val.url === requestedUrl && val.methods === requestedMethod) || allowed;
        });
      }else{
        allowed = true
      }
      allowed =
        allowed && (permissions.tenantId === id || permissions.tenantId === null); // allowed only if tenant scoped or same tenantid
    }
    
    if (!allowed) {
      return{
        success: false,
        message: "Not authorized"
      }
    }
    return{
      success: true,
      message: "Authorized"
    }
  }

  async createATenant(
    id: string,
    data: CreateTenantDto,
    headers: object,
  ): Promise<ResponseDto> {
    const valid = await this.authorizationHeaderVerifier(headers, id, "/tenant","POST");
    if(!valid.success){
      throw new UnauthorizedException({
        success: false,
        message: "You are not authorized"
      })
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
        success: false,
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
        success: true,
        message: 'Tenant created successfully!',
        data: tenant,
      };
    } catch (error) {
      console.log('Error from createATenant', error);
      throw new InternalServerErrorException({
        success: false,
        message: 'Error creating new tenant',
      });
    }
  }

  async updateATenant(
    id: string,
    data: CreateTenantDto,
    headers: object,
  ): Promise<ResponseDto> {
    const valid = await this.authorizationHeaderVerifier(headers, id,"/tenant", "PATCH");
    if(!valid.success){
      throw new UnauthorizedException({
        success: false,
        message: valid.message
      })
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
        success: true,
        message: 'Tenant updated successfully!',
        data: tenant,
      };
    } catch (error) {
      console.log('Error happend in updateATenant', this.updateATenant);
      throw new InternalServerErrorException({
        success: false,
        message: 'Error occured while updating the tenant',
      });
    }
  }

  async deleteATenant(id: string, headers: object): Promise<ResponseDto> {
    const valid = await this.authorizationHeaderVerifier(headers, id,"/tenant", "DELETE");
    if(!valid.success){
      throw new UnauthorizedException({
        success: false,
        message: valid.message
      })
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

  async returnATenant(id: string, headers: object): Promise<ResponseDto> {
    const valid = await this.authorizationHeaderVerifier(headers, id,"/tenant", "GET");
    if(!valid.success){
      throw new UnauthorizedException({
        success: false,
        message: valid.message
      })
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
    const valid = await this.authorizationHeaderVerifier(headers, null,"/tenant", "GET");
    if(!valid.success){
      throw new UnauthorizedException({
        success: false,
        message: valid.message
      })
    }
    const tenants = await this.prismaService.tenant.findMany();
    return {
      success: true,
      message: 'These are all the tenants',
      data: tenants,
    };
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
