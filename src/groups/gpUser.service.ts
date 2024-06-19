import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { addUserDTO, deleteMemberDTO } from './dtos/gpUser.dto';
import { HeaderAuthService } from 'src/header-auth/header-auth.service';
import { ResponseDto } from 'src/dto/response.dto';

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
    const tenantId = headers['x-stencil-tenantid'];
    if (!tenantId) {
      throw new BadRequestException({
        success: false,
        message: 'x-stencil-tenantid header missing',
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
    try {
      const response = [];

      await Promise.all(
        data.members.map(async (member) => {
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

          const addUsers = await Promise.all(
            member.userIds.map(async (userId) => {
              const user = await this.prismaService.user.findUnique({
                where: { id: String(userId) },
              });

              if (!user) {
                return {
                  success: false,
                  message: 'User id is not found in db',
                };
              }
              
              const group = await this.prismaService.group.findUnique({where: {id: member.groupId}});
              if(group.tenantId !== tenantId) return;

              const membership = await this.prismaService.groupMember.create({
                data: {
                    userId,
                    groupId: member.groupId,
                },
              });

              return membership;
            }),
          );

          if(addUsers.length > 0)
            return addUsers;
          return;
        }),
      );

      return {
        success: true,
        message: 'All given users added to their groups',
        data: response,
      };
    } catch (error) {
      this.logger.log(error);
      throw new BadRequestException({
        success: false,
        message: 'error occured while adding user',
      });
    }
  }

  async updateUser(data: addUserDTO, headers: object) {
    await Promise.all(
      data.members.map(async (member) => {
        if (!member.groupId) {
          throw new BadRequestException({
            success: false,
            message: 'Please send group id',
          });
        }

        const group = await this.prismaService.group.findUnique({
          where: { id: member.groupId },
        });

        if (!group) {
          throw new BadRequestException({
            success: false,
            message: 'Group id does not exist in db',
          });
        }
      }),
    );
  }

  async deleteByMemberId(uuid: string, headers: object): Promise<ResponseDto> {
    const tenantId = headers['x-stencil-tenantid'];
    if (!tenantId) {
      throw new BadRequestException({
        success: false,
        message: 'x-stencil-tenantid header missing',
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
      '/group/member',
      'DELETE',
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
    const tenantId = headers['x-stencil-tenantid'];
    if (!tenantId) {
      throw new BadRequestException({
        success: false,
        message: 'x-stencil-tenantid header missing',
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
      '/group/member',
      'DELETE',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: valid.success,
        message: valid.message,
      });
    }
    if (!userId || !gpId) {
      throw new BadRequestException({
        success: false,
        message: 'pls send user id and gp id both',
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
    const tenantId = headers['x-stencil-tenantid'];
    if (!tenantId) {
      throw new BadRequestException({
        success: false,
        message: 'x-stencil-tenantid header missing',
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
    const tenantId = headers['x-stencil-tenantid'];
    if (!tenantId) {
      throw new BadRequestException({
        success: false,
        message: 'x-stencil-tenantid header missing',
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
    try {
      const members = await Promise.all(
        data.members?.map(async (member) => {
          const membership = await this.prismaService.groupMember.findUnique({
            where: { id: member },
          });
          if (!membership) return;
          const group = await this.prismaService.group.findUnique({
            where: { id: membership.groupId },
          });
          if (group.tenantId !== tenant.id) return;
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
}
