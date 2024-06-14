import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ApplicationRolesService } from 'src/application/application-roles/application-roles.service';
import { ApplicationScopesService } from 'src/application/application-scopes/application-scopes.service';
import {
  CreateApplicationDto,
  UpdateApplicationDto,
} from 'src/application/application.dto';
import { ResponseDto } from 'src/dto/response.dto';
import { HeaderAuthService } from 'src/header-auth/header-auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { TenantService } from 'src/tenant/tenant.service';

@Injectable()
export class ApplicationService {
  private readonly logger: Logger;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly applicationRoles: ApplicationRolesService,
    private readonly applicationScopes: ApplicationScopesService,
    private readonly headerAuthService: HeaderAuthService,
  ) {
    this.logger = new Logger(ApplicationService.name);
  }

  async createApplication(
    uuid: string,
    data: CreateApplicationDto,
    headers: object,
  ): Promise<ResponseDto> {
    const tenant_id = headers['x-stencil-tenantid'];
    if (!tenant_id) {
      throw new BadRequestException({
        success: false,
        message: 'x-stencil-tenantid header missing',
      });
    }
    const valid = await this.headerAuthService.authorizationHeaderVerifier(
      headers,
      tenant_id,
      '/application',
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
        message: 'no id given',
      });
    }
    const application = await this.prismaService.application.findUnique({
      where: { id: uuid,name: data.name },
    });
    if (application) {
      throw new BadRequestException({
        success: false,
        message: 'Application with the provided id/name already exists',
      });
    }
    if (!data) {
      throw new BadRequestException({
        success: false,
        message: 'No data given',
      });
    }
    if (!data.jwtConfiguration) {
      throw new BadRequestException({
        success: false,
        message: 'jwtConfiguration not provided',
      });
    }
    const tenant = await this.prismaService.tenant.findUnique({where: {id: tenant_id}});
    if (!tenant) {
      throw new BadRequestException({
        success: false,
        message: 'No such tenant exists',
      });
    }
    const jwtConfiguration = data.jwtConfiguration;
    const accessTokenSigningKeysId = jwtConfiguration.accessTokenSigningKeysID;
    const idTokenSigningKeysId = jwtConfiguration.idTokenSigningKeysID;
    console.log(accessTokenSigningKeysId,idTokenSigningKeysId,tenant.accessTokenSigningKeysId,tenant.idTokenSigningKeysId);
    if (
      tenant.accessTokenSigningKeysId !== accessTokenSigningKeysId ||
      tenant.idTokenSigningKeysId !== idTokenSigningKeysId
    ) {
      throw new BadRequestException({
        success: false,
        message:
          "Either idTokenSigningKeysId or accessTokenSigningKeysId don't match with the given tenant's signing ids",
      });
    }
    const active = data.active ? data.active : true;
    const name = data.name;
    const roles = data.roles;
    const scopes = data.scopes;
    const tenantId = tenant.id;
    const configurations = JSON.stringify(data.oauthConfiguration);

    try {
      const application = await this.prismaService.application.create({
        data: {
          id: uuid,
          active,
          accessTokenSigningKeysId,
          idTokenSigningKeysId,
          name,
          tenantId,
          data: configurations,
        },
      });

      try {
        roles.forEach((value) =>
          this.applicationRoles.createRole(value, application.id),
        );
        scopes.forEach((value) =>
          this.applicationScopes.createScope(value, application.id),
        );
      } catch (error) {
        this.logger.log('This is error while creating scopes/roles: ', error);
        throw new InternalServerErrorException({
          success: false,
          message: 'Error while creating new scope/roles',
        });
      }

      this.logger.log('New application registred!', application);

      return {
        success: true,
        message: 'Application created successfully!',
        data: application,
      };
    } catch (error) {
      this.logger.log('Error occured in createApplication', error);
      throw new InternalServerErrorException({
        success: false,
        message: 'Error while creating new application',
      });
    }
  }

  async patchApplication(
    id: string,
    newData: UpdateApplicationDto,
    headers: object,
  ): Promise<ResponseDto> {
    if (!id) {
      throw new BadRequestException({
        success: false,
        message: 'no id given',
      });
    }
    const tenant_id = headers['x-stencil-tenantid'];
    if (!tenant_id) {
      throw new BadRequestException({
        success: false,
        message: 'x-stencil-tenantid header missing',
      });
    }
    const valid = await this.headerAuthService.authorizationHeaderVerifier(
      headers,
      tenant_id,
      '/application',
      'PATCH',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: valid.success,
        message: valid.message,
      });
    }
    if (!newData) {
      throw new BadRequestException({
        success: false,
        message: 'No data given for updation',
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
    const name = newData.name ? newData.name : application.name;
    // const jwtConfiguration = newData.jwtConfiguration
    //   ? newData.jwtConfiguration
    //   : null;

    const active =
      newData.active !== null ? newData.active : application.active;
    const data = newData.oauthConfiguration
      ? JSON.stringify(newData.oauthConfiguration)
      : application.data;

    try {
      const application = await this.prismaService.application.update({
        where: { id },
        data: {
          name,
          tenantId: tenant_id,
          active,
          data,
        },
      });
      return {
        success: true,
        message: 'Application updated successfully!',
        data: application,
      };
    } catch (error) {
      this.logger.log('Error from patchApplication', error);
      throw new InternalServerErrorException({
        success: false,
        message: 'Error while updating the application',
      });
    }
  }

  async returnAllApplications(headers: object): Promise<ResponseDto> {
    const valid = await this.headerAuthService.authorizationHeaderVerifier(
      headers,
      null,
      '/application',
      'GET',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: valid.success,
        message: valid.message,
      });
    }
    const allApplications = await this.prismaService.application.findMany();
    const result = await Promise.all(
      allApplications.map(async (val) => {
        const roles = await this.prismaService.applicationRole.findMany({
          where: { applicationsId: val.id },
        });
        const scopes = await this.prismaService.applicationOauthScope.findMany({
          where: { applicationsId: val.id },
        });
        return {
          application: val,
          scopes: scopes,
          roles: roles,
        };
      }),
    );
    return {
      success: true,
      message: 'All applications found successfully',
      data: result,
    };
  }

  async returnAnApplication(id: string, headers: object): Promise<ResponseDto> {
    const tenant_id = headers['x-stencil-tenantid'];
    if (!tenant_id) {
      throw new BadRequestException({
        success: false,
        message: 'x-stencil-tenantid header missing',
      });
    }
    const valid = await this.headerAuthService.authorizationHeaderVerifier(
      headers,
      tenant_id,
      '/application',
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
        message: 'No id given',
      });
    }
    const application = await this.prismaService.application.findUnique({
      where: {
        id,
      },
    });
    const roles = await this.prismaService.applicationRole.findMany({
      where: { applicationsId: id },
    });
    const scopes = await this.prismaService.applicationOauthScope.findMany({
      where: { applicationsId: id },
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
        message: 'You are not authorized',
      });
    }
    return {
      success: true,
      message: 'Application found successfully',
      data: { application, scopes, roles },
    };
  }

  async deleteApplication(
    id: string,
    hardDelete: boolean,
    headers: object,
  ): Promise<ResponseDto> {
    const tenant_id = headers['x-stencil-tenantid'];
    if (!tenant_id) {
      throw new BadRequestException({
        success: false,
        message: 'x-stencil-tenantid header missing',
      });
    }
    const valid = await this.headerAuthService.authorizationHeaderVerifier(
      headers,
      tenant_id,
      '/application',
      'DELETE',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: valid.success,
        message: valid.message,
      });
    }
    const oldApplication = await this.prismaService.application.findUnique({
      where: { id },
    });
    if (
      oldApplication.tenantId !== tenant_id &&
      valid.data.tenantsId !== null
    ) {
      throw new UnauthorizedException({
        success: false,
        message: 'You are not authorized enough',
      });
    }
    if (!oldApplication) {
      throw new BadRequestException({
        success: false,
        message: 'Application with given id dont exist',
      });
    }
    if (hardDelete) {
      try {
        const application = await this.prismaService.application.delete({
          where: { ...oldApplication },
        });
        return {
          success: true,
          message: 'Application deleted Successfully!',
          data: application,
        };
      } catch (error) {
        this.logger.log('Error from deleteApplication', error);
        throw new InternalServerErrorException({
          success: false,
          message: 'Some error occured while hard deleting the application',
        });
      }
    } else {
      const application = await this.patchApplication(
        id,
        { active: false },
        headers,
      );
      return {
        success: true,
        message: 'Application soft deleted/inactive',
        data: application,
      };
    }
  }

  async returnOauthConfiguration(
    id: string,
    headers: object,
  ): Promise<ResponseDto> {
    const tenant_id = headers['x-stencil-tenantid'];
    if (!tenant_id) {
      throw new BadRequestException({
        success: false,
        message: 'x-stencil-tenantid header missing',
      });
    }
    const valid = await this.headerAuthService.authorizationHeaderVerifier(
      headers,
      tenant_id,
      '/application',
      'GET',
    );
    if (!id) {
      throw new BadRequestException({
        success: false,
        message: 'no id given',
      });
    }
    const application = await this.prismaService.application.findUnique({
      where: { id },
    });
    if (!application) {
      throw new BadRequestException({
        success: false,
        message: 'No application with the given id exists',
      });
    }
    if (application.tenantId !== tenant_id && valid.data.tenantsId !== null) {
      throw new UnauthorizedException({
        success: false,
        message: 'You are not authorized enough',
      });
    }
    return {
      success: true,
      message: "Application's configurations are as follows",
      data: JSON.parse(application.data),
    };
  }
}
