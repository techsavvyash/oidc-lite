import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { addUserDTO, deleteMemberDTO } from './dtos/gpUser.dto';
import { HeaderAuthService } from '../header-auth/header-auth.service';
import { ResponseDto } from '../dto/response.dto';

@Injectable()
export class GroupUserService {
  private readonly logger: Logger;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly headerAuthService: HeaderAuthService,
  ) {
    this.logger = new Logger(GroupUserService.name);
  }

  async addUser(data: addUserDTO, headers: object) {
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
    if (tenantId) {
      const tenant = await this.prismaService.tenant.findUnique({
        where: { id: tenantId },
      });
      if (!tenant) {
        throw new BadRequestException({
          success: false,
          message: 'no such tenant exists',
        });
      }
    }
    try {
      const response = await Promise.all(
        data?.members?.map(async (member) => {
          if (!member.groupId) {
            return {
              success: false,
              message: 'Please send group id',
            };
          }
          const group = await this.prismaService.group.findUnique({
            where: { id: member.groupId },
          });
          if (!group) {
            return {
              success: false,
              message: 'Group id does not exist in db',
            };
          }
          if (group.tenantId !== tenantId && valid.data.tenantsId !== null) {
            return {
              success: false,
              message: 'You are not authorized enough',
            };
          }
          const addUsers = await this.addUsersInAGroup(
            member.userIds,
            group.id,
            group.tenantId,
            tenantId,
            valid.data.tenantsId,
          );

          if (addUsers.length > 0)
            return {
              success: true,
              message: `users added in ${group.id}`,
              addUsers,
            };
          return;
        }),
      );
      const finalResponse = response?.filter((i) => i.success);
      if (finalResponse.length <= 0) {
        return {
          success: false,
          message:
            'No valid userId and groupId given to add users to their given groups',
        };
      }
      return {
        success: true,
        message: 'All given users added to their valid groups',
        data: finalResponse,
      };
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException({
        success: false,
        message: 'error occured while adding user',
      });
    }
  }

  async deleteByMemberId(uuid: string, headers: object): Promise<ResponseDto> {
    const valid = await this.headerAuthService.validateRoute(
      headers,
      '/group/member',
      'DELETE',
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
        message: 'pls send uuid',
      });
    }
    const member = await this.prismaService.groupMember.findUnique({
      where: { id: uuid },
    });
    if (!member) {
      throw new BadRequestException({
        success: false,
        message: 'No such memberid exists',
      });
    }
    const gp = await this.prismaService.group.findUnique({
      where: { id: member.groupId },
    });
    if (gp.tenantId !== tenantId && valid.data.tenantsId !== null) {
      throw new UnauthorizedException({
        success: false,
        message: 'You are not authorized enough',
      });
    }
    try {
      const deleteMember = await this.prismaService.groupMember.delete({
        where: { id: member.id },
      });
      return {
        success: true,
        message: 'Memeber deleted successfully',
        data: deleteMember,
      };
    } catch (error) {
      this.logger.log(error);
      throw new BadRequestException({
        success: false,
        message: 'error occured while deleting user from member id',
      });
    }
  }

  async deleteViaUserAndGpId(
    userId: string,
    gpId: string,
    headers: object,
  ): Promise<ResponseDto> {
    const valid = await this.headerAuthService.validateRoute(
      headers,
      '/group/member',
      'DELETE',
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
    if (!userId || !gpId) {
      throw new BadRequestException({
        success: false,
        message: 'pls send user id and gp id both',
      });
    }
    const group = await this.prismaService.group.findUnique({
      where: { id: gpId },
    });
    if (!group) {
      throw new BadRequestException({
        success: false,
        message: 'No such group exists',
      });
    }
    if (group.tenantId !== tenantId && valid.data.tenantsId !== null) {
      throw new UnauthorizedException({
        success: false,
        message: 'You are not authorized enough',
      });
    }
    const membership = await this.prismaService.groupMember.findUnique({
      where: { group_members_uk_1: { userId, groupId: gpId } },
    });
    if (!membership) {
      throw new BadRequestException({
        success: false,
        message: 'either user id or gp id do not exist in db',
      });
    }
    try {
      const member = await this.prismaService.groupMember.delete({
        where: { group_members_uk_1: { userId, groupId: gpId } },
      });
      return {
        success: true,
        message: 'user membership deleted successfully',
        data: member,
      };
    } catch (error) {
      this.logger.log(error);
      throw new BadRequestException({
        success: false,
        message: 'error occured while deleting via userid and gp id',
      });
    }
  }

  async deleteAllUser(gpId: string, headers: object): Promise<ResponseDto> {
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
    if (!gpId) {
      throw new BadRequestException({
        success: false,
        message: 'pls send and gp id both',
      });
    }
    const group = await this.prismaService.group.findUnique({
      where: { id: gpId, tenantId: tenantId },
    });
    if (!group) {
      throw new BadRequestException({
        success: false,
        message: 'no such grp exists in given tenant',
      });
    }
    if (group.tenantId !== tenantId && valid.data.tenantsId !== null) {
      throw new UnauthorizedException({
        success: false,
        message: 'You are not authorized enough',
      });
    }
    try {
      const count = await this.prismaService.groupMember.deleteMany({
        where: {
          groupId: gpId,
        },
      });
      return {
        success: true,
        message: `All users removed from group`,
        data: count,
      };
    } catch (error) {
      this.logger.log(error);
      throw new BadRequestException({
        success: false,
        message: error.message || 'An error occurred',
      });
    }
  }

  async deleteMembers(data: deleteMemberDTO, headers: object) {
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
    try {
      const members = await Promise.all(
        data.members.map(async (member) => {
          const membership = await this.prismaService.groupMember.findUnique({
            where: { id: member },
          });
          if (!membership) return;
          const group = await this.prismaService.group.findUnique({
            where: { id: membership.groupId },
          });
          if (group.tenantId !== tenantId && valid.data.tenantsId !== null)
            return;
          const delMember = await this.prismaService.groupMember.delete({
            where: { ...membership },
          });
          return delMember;
        }),
      );
      return {
        success: true,
        message: 'members deleted successfully',
        data: members,
      };
    } catch (error) {
      this.logger.log(error);
      throw new BadRequestException({
        success: false,
        message: 'error occured from deleting members via member array',
      });
    }
  }

  private async addUsersInAGroup(
    userIds: string[],
    groupId: string,
    groupTenantId: string,
    tenantId: string,
    validTenantId: string,
  ) {
    const result = await Promise.all(
      userIds.map(async (userId) => {
        const user = await this.prismaService.user.findUnique({
          where: { id: userId },
        });
        if (!user) {
          return {
            success: false,
            message: 'User id is not found in db',
          };
        }
        if (user.tenantId !== tenantId && validTenantId !== null) {
          return {
            success: false,
            message: 'You are not authorized',
          };
        }
        if (user.tenantId !== groupTenantId) return;
        const oldMembership = await this.prismaService.groupMember.findUnique({
          where: { group_members_uk_1: { groupId, userId } },
        });
        if (oldMembership) return;
        const membership = await this.prismaService.groupMember.create({
          data: {
            userId,
            groupId: groupId,
          },
        });
        return membership;
      }),
    );
    const finalResult = result.filter((i) => i);
    return finalResult;
  }
}
