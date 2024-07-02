import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ResponseDto } from 'src/dto/response.dto';
import { CreateUserDto, UpdateUserDto, UserData } from './user.dto';
import { HeaderAuthService } from '../header-auth/header-auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { UtilsService } from '../utils/utils.service';

@Injectable()
export class UserService {
  private readonly logger: Logger;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly headerAuthService: HeaderAuthService,
    private readonly utilService: UtilsService,
  ) {
    this.logger = new Logger(UserService.name);
  }

  async createAUser(
    id: string,
    data: CreateUserDto,
    headers: object,
  ): Promise<ResponseDto> {
    if (!data) {
      throw new BadRequestException({
        success: false,
        message: 'No data given to create a user',
      });
    }
    const valid = await this.headerAuthService.validateRoute(
      headers,
      '/user',
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
          'x-stencil-tenantid header required with tenant scoped authorization key',
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
    if (!id) {
      throw new BadRequestException({
        success: false,
        message: 'user id not given',
      });
    }

    if (!data.active || !data.membership || !data.userData || !data.email) {
      throw new BadRequestException({
        success: false,
        message: 'Data missing active, membership array, email or userData',
      });
    }

    const oldUser = await this.prismaService.user.findUnique({
      where: {
        id,
      },
    });
    if (oldUser) {
      throw new BadRequestException({
        success: false,
        message: 'user with the given id already exists',
      });
    }

    const { active, additionalData, membership, userData } = data;
    userData.password = await this.utilService.hashPassword(userData.password);
    const userInfo = {
      userData,
      additionalData,
    };
    try {
      const user = await this.prismaService.user.create({
        data: {
          id,
          active,
          tenantId,
          data: JSON.stringify(userInfo),
          email: data.email,
        },
      });
      this.logger.log('A new user created', user);
      const existingGroups = await Promise.all(
        membership?.map(async (val) => {
          const group = await this.prismaService.group.findUnique({
            where: { id: val },
          });
          if (!group) return;
          if (group.tenantId !== tenant.id) return;
          await this.prismaService.groupMember.create({
            data: {
              groupId: group.id,
              userId: user.id,
            },
          });
          return group.id;
        }),
      );
      const groups = existingGroups.filter((i) => i);
      return {
        success: true,
        message: 'New user created',
        data: { user, groups },
      };
    } catch (error) {
      this.logger.log('Error occured in createAUser', error);
      throw new InternalServerErrorException({
        success: false,
        message: 'Error occured while creating a new user',
      });
    }
  }

  async returnAUser(id: string, headers: object): Promise<ResponseDto> {
    const valid = await this.headerAuthService.validateRoute(
      headers,
      '/user',
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
        message: 'user id not given',
      });
    }

    const user = await this.prismaService.user.findUnique({
      where: {
        id,
      },
    });
    if (!user) {
      throw new BadRequestException({
        success: false,
        message: 'user with the given id dont exists',
      });
    }
    if (user.tenantId !== tenantId && valid.data.tenantsId !== null) {
      throw new UnauthorizedException({
        success: false,
        message: 'You are not authorized',
      });
    }
    return {
      success: true,
      message: 'User found successfully',
      data: user,
    };
  }

  async updateAUser(
    id: string,
    data: UpdateUserDto,
    headers: object,
  ): Promise<ResponseDto> {
    const valid = await this.headerAuthService.validateRoute(
      headers,
      '/user',
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

    if (!id) {
      throw new BadRequestException({
        success: false,
        message: 'user id not given',
      });
    }
    if (!data) {
      throw new BadRequestException({
        success: false,
        message: 'No data given to update the user',
      });
    }

    const oldUser = await this.prismaService.user.findUnique({
      where: {
        id,
      },
    });
    if (!oldUser) {
      throw new BadRequestException({
        success: false,
        message: 'user with the given id dont exists',
      });
    }
    if (oldUser.tenantId !== tenantId && valid.data.tenantsId !== null) {
      throw new UnauthorizedException({
        success: false,
        message: 'You are not authorized',
      });
    }
    const active = data.active ? data.active : oldUser.active;
    const oldUserData = JSON.parse(oldUser.data);
    const userData: UserData = data.userData
      ? data.userData
      : oldUserData?.userData;
    const additionalData = data.additionalData
      ? data.additionalData
      : oldUserData?.additionalData;
    if (data.membership && data.membership.length > 0) {
      const membership = data.membership;
      const existingGroups = await Promise.all(
        membership?.map(async (val) => {
          const group = await this.prismaService.group.findUnique({
            where: { id: val },
          });
          if (!group) return;
          if (group.tenantId !== oldUser.tenantId) return;
          await this.prismaService.groupMember.create({
            data: {
              groupId: group.id,
              userId: oldUser.id,
            },
          });
          return group.id;
        }),
      );
    }
    const userInfo = {
      userData,
      additionalData,
    };
    try {
      const user = await this.prismaService.user.update({
        where: { id },
        data: {
          active,
          data: JSON.stringify(userInfo),
        },
      });
      this.logger.log('A User is updated', user);
      return {
        success: true,
        message: 'User updated successfully',
        data: user,
      };
    } catch (error) {
      this.logger.log('Error occured in updateAUser', error);
      throw new InternalServerErrorException({
        success: false,
        message: 'Error occured while updating the user',
      });
    }
  }

  async deleteAUser(
    id: string,
    headers: object,
    hardDelete: string,
  ): Promise<ResponseDto> {
    const valid = await this.headerAuthService.validateRoute(
      headers,
      '/user',
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

    if (!id) {
      throw new BadRequestException({
        success: false,
        message: 'user id not given',
      });
    }

    const user = await this.prismaService.user.findUnique({
      where: {
        id,
      },
    });
    if (!user) {
      throw new BadRequestException({
        success: false,
        message: 'user with the given id dont exists',
      });
    }
    if (user.tenantId !== tenantId && valid.data.tenantsId !== null) {
      throw new UnauthorizedException({
        success: false,
        message: 'You are not authorized',
      });
    }
    if (hardDelete) {
      const delUser = await this.prismaService.user.delete({
        where: { ...user },
      });
      this.logger.log('A user deleted permanently', delUser);
      return {
        success: true,
        message: 'User deleted permanently',
        data: delUser,
      };
    } else {
      const delUser = await this.prismaService.user.update({
        where: { id },
        data: {
          active: false,
        },
      });
      this.logger.log('A user inactivated', delUser);
      return {
        success: true,
        message: 'User inactivated',
        data: delUser,
      };
    }
  }
}
