import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RoleDto, UpdateRoleDto } from '../application.dto';
import { ResponseDto } from '../../dto/response.dto';
import { HeaderAuthService } from '../../header-auth/header-auth.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApplicationRolesService {
  private readonly logger: Logger;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly headerAuthService: HeaderAuthService,
  ) {
    this.logger = new Logger(ApplicationRolesService.name);
  }

  async createRole(
    data: RoleDto,
    applicationsId: string,
    roleId: string,
    headers: object,
  ): Promise<ResponseDto> {
    const valid = await this.headerAuthService.validateRoute(
      headers,
      '/application/role',
      'POST',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: valid.success,
        message: valid.message,
      });
    }
    const tenant_id = valid.data.tenantsId
      ? valid.data.tenantsId
      : headers['x-stencil-tenantid'];
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

    let id = null;
    if (data.id) {
      id = data.id;
    } else if (roleId) {
      id = roleId;
    } else {
      id = randomUUID();
    }

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


  async updateRole(
    id: string,
    roleId: string,
    data: UpdateRoleDto,
    headers: object,
  ): Promise<ResponseDto> {
    const valid = await this.headerAuthService.validateRoute(
      headers,
      '/application/role',
      'PATCH',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: valid.success,
        message: valid.message,
      });
    }
    const tenant_id = valid.data.tenantsId
      ? valid.data.tenantsId
      : headers['x-stencil-tenantid'];
    if (!data) {
      throw new BadRequestException({
        success: false,
        message: 'no data given for role updation',
      });
    }
    if (!id) {
      throw new BadRequestException({
        success: false,
        message: 'no Application id given for role updation',
      });
    }
    const application = await this.prismaService.application.findUnique({
      where: { id },
    });
    if (!application) {
      throw new BadRequestException({
        success: false,
        message: 'Application with the given id dont exist',
      });
    }
    if (application.tenantId !== tenant_id && valid.data.tenantsId !== null) {
      throw new UnauthorizedException({
        success: false,
        message: 'You are not authorized enough',
      });
    }
    try {
      const role = await this.prismaService.applicationRole.update({
        where: { id: roleId, applicationsId: id },
        data: {
          ...data,
        },
      });
      this.logger.log('Role updated', role);
      return {
        success: true,
        message: 'role updated successfully',
        data: role,
      };
    } catch (error) {
      this.logger.log('Error occured while updating role', error);
      throw new InternalServerErrorException({
        success: false,
        message: 'Error while updating the role',
      });
    }
  }

  async deleteRole(
    id: string,
    roleId: string,
    headers: object,
  ): Promise<ResponseDto> {
    const valid = await this.headerAuthService.validateRoute(
      headers,
      '/application/role',
      'DELETE',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: valid.success,
        message: valid.message,
      });
    }
    const tenant_id = valid.data.tenantsId
      ? valid.data.tenantsId
      : headers['x-stencil-tenantid'];
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
    // if (!roleId) {
    //   throw new BadRequestException({
    //     success: false,
    //     message: 'No role id provided',
    //   });
    // }
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
