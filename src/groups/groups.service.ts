import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GroupPermissions, UpdateGroupDto, createGroupDTO } from './dtos/groups.dto';
import { Prisma } from '@prisma/client';
import { HeaderAuthService } from 'src/header-auth/header-auth.service';
import { ResponseDto } from 'src/dto/response.dto';

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
    const tenant = await this.prismaService.tenant.findUnique({
      where: { id: data.tenantId },
    });
    if (!tenant) {
      throw new BadRequestException({
        success: false,
        message: 'No such tenant exists',
      });
    }
    const valid = await this.headerAuthService.authorizationHeaderVerifier(
      headers,
      tenant.id,
      '/group',
      'POST',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: valid.success,
        message: valid.message,
      });
    }
    const item = await Promise.all(
      data.roleIDs.map(async (roleId: string) => {
        const applicationRole =
          await this.prismaService.applicationRole.findUnique({
            where: { id: roleId },
          });
        if (!applicationRole) return;
        const application = await this.prismaService.application.findUnique({
          where: { id: applicationRole.applicationsId },
        });
        if (application.tenantId !== tenant.id) return; // not in same tenant so roles cant be assigned
        return {
          applicationId: applicationRole.applicationsId,
          applicationRole,
        };
      }),
    );
    const finalRoles = item.filter((i) => i); // removes null values. this will be added in permissions
    try {
      const group = await this.prismaService.group.create({
        data: {
          name: data.name,
          permissions: JSON.stringify(finalRoles),
          tenantId: tenant.id,
        },
      });
      const applicationRoles = await Promise.all(finalRoles.map(async (role) => {
        return await this.prismaService.groupApplicationRole.create({data: {
          applicationRolesId: role.applicationRole.id,
          groupsId: group.id,
        }})
      }));
      this.logger.log('A new group created', group,applicationRoles);
      return {
        success: true,
        message: 'Group created successfully',
        data: group,
      };
    } catch (error) {
      this.logger.log(error);
      throw new BadRequestException({
        success: false,
        message: 'error while creating data format of sending group data',
      });
    }
  }

  async retrieveAllGroups(headers: object): Promise<ResponseDto> {
    const tenantId = headers['x-stencil-tenantid'];
    const valid = await this.headerAuthService.authorizationHeaderVerifier(
      headers,
      tenantId,
      '/group',
      'GET',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: valid.success,
        message: valid.message,
      });
    }
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
    const tenantId = headers['x-stencil-tenantid'];
    if (!tenantId) {
      throw new BadRequestException({
        success: false,
        message: 'x-stencil-tenantid missing',
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
    const valid = await this.headerAuthService.authorizationHeaderVerifier(
      headers,
      tenant.id,
      '/group',
      'GET',
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
        message: 'please send group id while sending reqeust',
      });
    }
    try {
      const group = await this.prismaService.group.findUnique({
        where: { id: id, tenantId },
      });
      if (group) {
        return {
          success: true,
          message: 'group retrieved by given id',
          data: group,
        };
      } else {
        throw new BadRequestException({
          success: false,
          message: 'group not found with given id',
        });
      }
    } catch (error) {
      this.logger.log(error);
      throw new BadRequestException({
        success: false,
        message: 'error occured while finding the group',
      });
    }
  }

  async updateGp(
    uuid: string,
    data: UpdateGroupDto,
    headers: object,
  ): Promise<ResponseDto> {
    const tenantId = headers['x-stencil-tenantid'];
    if (!tenantId) {
      throw new BadRequestException({
        success: false,
        message: 'x-stencil-tenantid missing',
      });
    }
    const tenant = await this.prismaService.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new BadRequestException({
        success: false,
        message: 'no such tenant exists',
      });
    }
    const valid = await this.headerAuthService.authorizationHeaderVerifier(
      headers,
      tenant.id,
      '/group',
      'POST',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: valid.success,
        message: valid.message,
      });
    }
    if (!uuid) {
      throw new BadRequestException({
        success: false,
        message: 'please send id alogn with request',
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
    const item = await Promise.all(
      data.roleIDs?.map(async (roleId: string) => {
        const applicationRole =
          await this.prismaService.applicationRole.findUnique({
            where: { id: roleId },
          });
        if (!applicationRole) return;
        const application = await this.prismaService.application.findUnique({
          where: { id: applicationRole.applicationsId },
        });
        if (application.tenantId !== tenant.id) return; // not in same tenant so roles cant be assigned
        return {
          applicationId: applicationRole.applicationsId,
          applicationRole,
        };
      }),
    );
    const finalRoles = item.filter((i) => i); // removes null values. this will be added in permissions
    const updatedRoles =
      finalRoles.length > 0
        ? finalRoles
        : (JSON.parse(oldGroup.permissions) as GroupPermissions);
    const updatedName = data.name ? data.name : oldGroup.name;
    try {
      const updatedGroup = await this.prismaService.group.update({
        where: { id: oldGroup.id },
        data: {
          name: updatedName,
          permissions: JSON.stringify(updatedRoles),
        },
      });
      return {
        success: true,
        message: 'Group updated',
        data: updatedGroup,
      };
    } catch (error) {
      this.logger.log(error);
      throw new BadRequestException({
        success: false,
        message: 'error while finding a gp',
      });
    }
  }

  async deleteGroup(uuid: string, headers: object): Promise<ResponseDto> {
    const tenantId = headers['x-stencil-tenantid'];
    if (!tenantId) {
      throw new BadRequestException({
        success: false,
        message: 'x-stencil-tenantid missing',
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
    const valid = await this.headerAuthService.authorizationHeaderVerifier(
      headers,
      tenant.id,
      '/group',
      'GET',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: valid.success,
        message: valid.message,
      });
    }
    if (!uuid) {
      throw new BadRequestException({
        success: false,
        message: 'please send id alogn with request',
      });
    }
    const group = await this.prismaService.group.findUnique({
      where: { id: uuid, tenantId },
    });
    if (!group) {
      throw new BadRequestException({
        success: false,
        message: 'unable to find group with given id',
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
}
