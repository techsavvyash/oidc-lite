import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateGroupDto, createGroupDTO } from './dtos/groups.dto';
import { HeaderAuthService } from '../header-auth/header-auth.service';
import { ResponseDto } from '../dto/response.dto';

@Injectable()
export class GroupsService {
  private readonly logger: Logger;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly headerAuthService: HeaderAuthService,
  ) {
    this.logger = new Logger(GroupsService.name);
  }

  async createGroup(
    data: createGroupDTO,
    uuid: string,
    headers: object,
  ): Promise<ResponseDto> {
    if (!uuid) {
      throw new BadRequestException({
        success: false,
        message: 'please provide a valid id',
      });
    }
    const valid = await this.headerAuthService.validateRoute(
      headers,
      '/group',
      'POST',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: valid.success,
        message: valid.message,
      });
    }
    const tenantId = valid.data.tenantsId
      ? valid.data.tenantsId
      : headers['x-stencil-tenantid'];
    if (!tenantId) {
      throw new BadRequestException({
        success: false,
        message:
          'x-stencil-tenantid header required when using tenant scoped key',
      });
    }
    const tenant = await this.prismaService.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new BadRequestException({
        success: false,
        message: 'No such tenant exists',
      });
    }
    const finalRoles = await this.extractRolesFromRoleId(
      data.roleIDs,
      tenantId,
    );
    const existingGroup = await this.prismaService.group.findUnique({
      where: { groups_uk_1: { name: data.name, tenantId } },
    });
    if (existingGroup) {
      throw new BadRequestException({
        success: false,
        message: 'Group with the same name already exists for this tenant',
      });
    }
    try {
      const group = await this.prismaService.group.create({
        data: {
          id: uuid,
          name: data.name,
          tenantId: tenant.id,
        },
      });
      const applicationRoles = await Promise.all(
        finalRoles?.map(async (role) => {
          return await this.saveGroupApplicationRole(
            group.id,
            role?.applicationRole.id,
          );
        }),
      );
      this.logger.log('A new group created', group, applicationRoles);
      return {
        success: true,
        message: 'Group created successfully',
        data: group,
      };
    } catch (error) {
      console.log(error);
      this.logger.log(error);
      throw new BadRequestException({
        success: false,
        message: 'error while creating data format of sending group data',
      });
    }
  }

  async retrieveAllGroups(headers: object): Promise<ResponseDto> {
    const valid = await this.headerAuthService.validateRoute(
      headers,
      '/group',
      'GET',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: valid.success,
        message: valid.message,
      });
    }
    const tenantId = valid.data.tenantsId
      ? valid.data.tenantsId
      : headers['x-stencil-tenantid'];
    try {
      if (!tenantId) {
        const gps = await this.prismaService.group.findMany();
        return {
          success: true,
          message: 'All groups found',
          data: gps,
        };
      } else {
        const gps = await this.prismaService.group.findMany({
          where: { tenantId: tenantId },
        });
        return {
          success: true,
          message: 'All groups of the provided tenant found',
          data: gps,
        };
      }
    } catch (error) {
      this.logger.log(error);
      throw new BadRequestException({
        success: false,
        message: 'error while finding groups',
      });
    }
  }

  async retrieveGpById(id: string, headers: object): Promise<ResponseDto> {
    const valid = await this.headerAuthService.validateRoute(
      headers,
      '/group',
      'GET',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: valid.success,
        message: valid.message,
      });
    }
    const tenantId = valid.data.tenantsId
      ? valid.data.tenantsId
      : headers['x-stencil-tenantid'];
    if (!id) {
      throw new BadRequestException({
        success: false,
        message: 'please send group id while sending reqeust',
      });
    }
    const group = await this.prismaService.group.findUnique({
      where: { id: id },
    });
    if (!group) {
      throw new BadRequestException({
        success: false,
        message: 'group not found with given id',
      });
    }
    try {
      if (group.tenantId === tenantId || valid.data.tenantsId === null) {
        return {
          success: true,
          message: 'group retrieved by given id',
          data: group,
        };
      }
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException({
        success: false,
        message: 'error occured while finding the group',
      });
    }
    return{
      success: false,
      message: 'group not found with given id',
    };
  }

  async updateGp(
    uuid: string,
    data: UpdateGroupDto,
    headers: object,
  ): Promise<ResponseDto> {
    const valid = await this.headerAuthService.validateRoute(
      headers,
      '/group',
      'PATCH',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: valid.success,
        message: valid.message,
      });
    }
    const tenantId = valid.data.tenantsId
      ? valid.data.tenantsId
      : headers['x-stencil-tenantid'];
    if (!uuid) {
      throw new BadRequestException({
        success: false,
        message: 'please send id along with request',
      });
    }
    const oldGroup = await this.prismaService.group.findUnique({
      where: { id: uuid },
    });
    if (!oldGroup) {
      throw new BadRequestException({
        success: false,
        message: 'unable to find group with given id',
      });
    }
    if (oldGroup.tenantId !== tenantId && valid.data.tenantsId === null) {
      throw new UnauthorizedException({
        success: false,
        message: 'You are not authorized enough',
      });
    }
    const finalRoles = await this.extractRolesFromRoleId(
      data.roleIDs,
      tenantId,
    );
    const applicationRoles = await Promise.all(
      finalRoles.map(async (role) => {
        return await this.saveGroupApplicationRole(
          oldGroup.id,
          role.applicationRole.id,
        );
      }),
    );
    const updatedName = data.name ? data.name : oldGroup.name;
    try {
      const updatedGroup = await this.prismaService.group.update({
        where: { id: oldGroup.id },
        data: {
          name: updatedName,
        },
      });
      this.logger.log('Group updated', updatedGroup, applicationRoles);
      return {
        success: true,
        message: 'Group updated',
        data: updatedGroup,
      };
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException({
        success: false,
        message: 'error while finding a gp',
      });
    }
  }

  async deleteGroup(uuid: string, headers: object): Promise<ResponseDto> {
    const valid = await this.headerAuthService.validateRoute(
      headers,
      '/group',
      'GET',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: valid.success,
        message: valid.message,
      });
    }
    const tenantId = valid.data.tenantsId
      ? valid.data.tenantsId
      : headers['x-stencil-tenantid'];
    if (!uuid) {
      throw new BadRequestException({
        success: false,
        message: 'please send id along with request',
      });
    }
    const group = await this.prismaService.group.findUnique({
      where: { id: uuid},
    });
    if (!group) {
      throw new BadRequestException({
        success: false,
        message: 'unable to find group with given id',
      });
    }
    if (group.tenantId !== tenantId && valid.data.tenantsId !== null) {
      throw new UnauthorizedException({
        success: false,
        message: 'You are not authorized enough',
      });
    }
    try {
      const group = await this.prismaService.group.delete({
        where: { id: uuid },
      });
      return {
        success: true,
        message: 'group with given id deleted successfully',
        data: group,
      };
    } catch (error) {
      this.logger.log(error);
      throw new BadRequestException({
        success: false,
        message: 'error occured while searching for a gp id',
      });
    }
  }

  private async saveGroupApplicationRole(
    groupId: string,
    applicationRoleId: string,
  ) {
    const findRole = await this.prismaService.groupApplicationRole.findUnique({
      where: {
        group_application_roles_uk_1: {
          applicationRolesId: applicationRoleId,
          groupsId: groupId,
        },
      },
    });
    if (findRole) return findRole;
    return await this.prismaService.groupApplicationRole.create({
      data: { groupsId: groupId, applicationRolesId: applicationRoleId },
    });
  }

  private async extractRolesFromRoleId(roleIDs: string[], tenantId: string) {
    if (roleIDs === null || roleIDs.length <= 0) {
      return null;
    }
    const item = await Promise.all(
      roleIDs.map(async (roleId: string) => {
        const applicationRole =
          await this.prismaService.applicationRole.findUnique({
            where: { id: roleId },
          });
        if (!applicationRole) return;
        const application = await this.prismaService.application.findUnique({
          where: { id: applicationRole.applicationsId },
        });
        if (application.tenantId !== tenantId) return; // not in same tenant so roles cant be assigned
        return {
          applicationId: applicationRole.applicationsId,
          applicationRole,
        };
      }),
    );
    const finalRoles = item.filter((i) => i);
    return finalRoles;
  }
}
