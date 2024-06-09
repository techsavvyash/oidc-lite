import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Permissions } from 'src/dto/apiKey.dto';
import { ResponseDto } from 'src/dto/response.dto';
import { CreateUserDto, UpdateUserDto } from 'src/dto/user.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  private readonly logger: Logger;
  constructor(private readonly prismaService: PrismaService) {
    this.logger = new Logger();
  }

  async authorizationHeaderVerifier(
    headers: object,
    tenantID: string,
    requestedUrl: string,
    requestedMethod: string,
  ): Promise<ResponseDto> {
    const token = headers['authorization'];
    if (!token) {
      return {
        success: false,
        message: 'authorization header required',
      };
    }
    const headerKey = await this.prismaService.authenticationKey.findUnique({
      where: {
        keyValue: token,
      },
    });
    if (!headerKey) {
      return {
        success: false,
        message: 'You are not authorized',
      };
    }
    const permissions: Permissions = JSON.parse(headerKey.permissions);
    let allowed = permissions ? false : true;
    if (permissions) {
      if (permissions.endpoints) {
        permissions.endpoints.forEach((val) => {
          allowed =
            (val.url === requestedUrl && val.methods === requestedMethod) ||
            allowed;
        });
      } else {
        allowed = true;
      }
      allowed =
        allowed &&
        (permissions.tenantId === tenantID || permissions.tenantId === null); // allowed only if tenant scoped or same tenantid
    }

    if (!allowed) {
      return {
        success: false,
        message: 'Not authorized',
      };
    }
    return {
      success: true,
      message: 'Authorized',
    };
  }

  async createAUser(
    id: string,
    data: CreateUserDto,
    headers: object,
  ): Promise<ResponseDto> {
    if (!data) {
      throw new BadRequestException({
        success: false,
        message: 'No data given to create a tenant',
      });
    }
    const { tenantId } = data;
    if (!tenantId) {
      throw new BadRequestException({
        success: false,
        message: 'Data dont have tenantId',
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
    const valid = await this.authorizationHeaderVerifier(
      headers,
      tenantId,
      '/user',
      'POST',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: false,
        message: valid.message,
      });
    }
    if (!id) {
      throw new BadRequestException({
        success: false,
        message: 'user id not given',
      });
    }

    if (
      !data.active ||
      !data.applicationId ||
      !data.membership ||
      !data.userData
    ) {
      throw new BadRequestException({
        success: false,
        message:
          'Data missing active, applicationId, membership array or userData',
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

    const { active, applicationId, additionalData, membership, userData } =
      data;
    if (membership.length === 0) {
      throw new BadRequestException({
        success: false,
        message: 'User must be a member of one group',
      });
    }
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
          groupId: membership[0].groupId,
          data: JSON.stringify(userInfo),
        },
      });
      this.logger.log('A new user created', user);
      return {
        success: true,
        message: 'New user created',
        data: user,
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
    const tenantID = headers['x-stencil-tenantid'];
    if (!tenantID) {
      throw new UnauthorizedException({
        success: false,
        message: 'x-stencil-tenantid missing in header',
      });
    }
    const valid = await this.authorizationHeaderVerifier(
      headers,
      tenantID,
      '/user',
      'GET',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: false,
        message: valid.message,
      });
    }

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
    const tenantID = headers['x-stencil-tenantid'];
    if (!tenantID) {
      throw new UnauthorizedException({
        success: false,
        message: 'x-stencil-tenantid missing in header',
      });
    }
    const valid = await this.authorizationHeaderVerifier(
      headers,
      tenantID,
      '/user',
      'GET',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: false,
        message: valid.message,
      });
    }

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
    const active = data.active ? data.active : oldUser.active;
    const oldUserData = JSON.parse(oldUser.data);
    const userData = data.userData ? data.userData : oldUserData?.userData;
    const additionalData = data.additionalData
      ? data.additionalData
      : oldUserData?.additionalData;
    const applicationId = data.applicationId;
    const groupId = data.membership?.[0].groupId
      ? data.membership[0].groupId
      : oldUser.groupId;
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
          groupId,
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
    const tenantID = headers['x-stencil-tenantid'];
    if (!tenantID) {
      throw new UnauthorizedException({
        success: false,
        message: 'x-stencil-tenantid missing in header',
      });
    }
    const valid = await this.authorizationHeaderVerifier(
      headers,
      tenantID,
      '/user',
      'GET',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: false,
        message: valid.message,
      });
    }

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
    if (user.tenantId !== tenantID) {
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
