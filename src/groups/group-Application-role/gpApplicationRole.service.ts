import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { HeaderAuthService } from 'src/header-auth/header-auth.service';
import { ResponseDto } from 'src/dto/response.dto';
import { RoleDto } from '../groups.dto';

@Injectable()
export class GroupAppRoleService {
  private readonly logger: Logger;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly headerAuthService: HeaderAuthService,
  ) {
    this.logger = new Logger();
  }

  async createRole(
    data: RoleDto,
    applicationsId: string,
    roleId: string,
    headers: object,
  ): Promise<ResponseDto> {
    const tenant_id = headers['x-stencil-tenantid'];
    if (!tenant_id) {
      throw new BadRequestException({
        success: false,
        message: 'x-stencil-tenantid missing',
      });
    }
    const valid = await this.headerAuthService.authorizationHeaderVerifier(
      headers,
      tenant_id,
      '/application/role',
      'POST',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: valid.success,
        message: valid.message,
      });
    }
    if (!data) {
      throw new BadRequestException({
        success: false,
        message: 'no data given for role creation',
      });
    }
    if (!applicationsId) {
      throw new BadRequestException({
        success: false,
        message: 'no Application id given for role creation',
      });
    }
    const application = await this.prismaService.application.findUnique({
      where: { id: applicationsId },
    });
    if (!application) {
      throw new BadRequestException({
        success: false,
        message: 'Application with the provided id dont exist',
      });
    }
    if (application.tenantId !== tenant_id && valid.data.tenantsId !== null) {
      throw new UnauthorizedException({
        success: false,
        message: 'You are not authorized enough',
      });
    }
    const { description, name, isDefault, isSuperRole } = data;
    console.log(data);
    let id = null;
    if (data.id) {
      id = data.id;
    } else if (roleId) {
      id = roleId;
    } else {
      id = randomUUID();
    }
    console.log(randomUUID());
    try {
      const newRole = await this.prismaService.applicationRole.create({
        data: {
          id,
          description,
          name,
          isDefault,
          isSuperRole,
          applicationsId,
        },
      });
      this.logger.log('New role added!', newRole);
      return {
        success: true,
        message: 'successfully created a new role',
        data: { newRole, applicationsId },
      };
    } catch (error) {
      this.logger.log('Error creating a new Role', error);
      throw new InternalServerErrorException({
        success: false,
        message: 'Error creating role',
        data,
      });
    }
  }

  async deleteRole(
    id: string,
    roleId: string,
    headers: object,
  ): Promise<ResponseDto> {
    const tenant_id = headers['x-stencil-tenantid'];
    if (!tenant_id) {
      throw new BadRequestException({
        success: false,
        message: 'x-stencil-tenantid missing',
      });
    }
    const valid = await this.headerAuthService.authorizationHeaderVerifier(
      headers,
      tenant_id,
      '/application/role',
      'DELETE',
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
        message: 'No application id provided',
      });
    }
    const application = await this.prismaService.application.findUnique({
      where: { id: id },
    });
    if (!application) {
      throw new BadRequestException({
        success: false,
        message: 'no application with given id exists',
      });
    }
    if (application.tenantId !== tenant_id && valid.data.tenantsId !== null) {
      throw new UnauthorizedException({
        success: false,
        message: 'You are not authorized enough',
      });
    }
    if (!roleId) {
      throw new BadRequestException({
        success: false,
        message: 'No role id provided',
      });
    }
    try {
      const role = await this.prismaService.applicationRole.delete({
        where: { id: roleId, applicationsId: id },
      });
      return {
        success: true,
        message: 'role deleted successfully',
        data: role,
      };
    } catch (error) {
      this.logger.log('Error from deleteRole', error);
      throw new InternalServerErrorException({
        success: false,
        message: 'Some error occured while deleting the role',
      });
    }
  }
}
