import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RoleDto, UpdateRoleDto } from 'src/application/application.dto';
import { ResponseDto } from 'src/dto/response.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ApplicationRolesService {
  private readonly logger: Logger;
  constructor(private readonly prismaService: PrismaService) {
    this.logger = new Logger();
  }

  async createRole(
    data: RoleDto,
    applicationsId: string,
    roleId?: string,
  ): Promise<ResponseDto> {
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

  async getRole(applicationsId: string, id: string): Promise<ResponseDto> {
    if (!applicationsId) {
      throw new BadRequestException({
        success: false,
        message: 'No application id given',
      });
    }
    if (!id) {
      throw new BadRequestException({
        success: false,
        message: 'no id given to find role',
      });
    }
    const application = await this.prismaService.application.findUnique({
      where: { id: applicationsId },
    });
    if (!application) {
      throw new BadRequestException({
        success: false,
        message: 'No application with the given id exists',
      });
    }
    const role = await this.prismaService.applicationRole.findUnique({
      where: {
        id,
        applicationsId,
      },
    });
    if (!role) {
      throw new BadRequestException({
        success: false,
        message: 'Asked role dont exists on given application',
      });
    }
    return {
      success: true,
      message: 'role found',
      data: role,
    };
  }

  async updateRole(
    id: string,
    roleId: string,
    data: UpdateRoleDto,
  ): Promise<ResponseDto> {
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

  async deleteRole(id: string, roleId: string): Promise<ResponseDto> {
    if (!id) {
      throw new BadRequestException({
        success: false,
        message: 'No application id provided',
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
