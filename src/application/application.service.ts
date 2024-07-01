import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ApplicationRolesService } from './application-roles/application-roles.service';
import { ApplicationScopesService } from './application-scopes/application-scopes.service';
import {
  ApplicationDataDto,
  CreateApplicationDto,
  JwtConfiguration,
  UpdateApplicationDto,
} from './application.dto';
import { ResponseDto } from '../dto/response.dto';
import { HeaderAuthService } from '../header-auth/header-auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { UtilsService } from '../utils/utils.service';
import { Response } from 'express';

@Injectable()
export class ApplicationService {
  private readonly logger: Logger;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly applicationRoles: ApplicationRolesService,
    private readonly applicationScopes: ApplicationScopesService,
    private readonly headerAuthService: HeaderAuthService,
    private readonly utilService: UtilsService,
  ) {
    this.logger = new Logger(ApplicationService.name);
  }

  async createApplication(
    uuid: string,
    data: CreateApplicationDto,
    headers: object,
    res: Response,
  ) {
    const valid = await this.headerAuthService.validateRoute(
      headers,
      '/application',
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
    if (!tenant_id) {
      throw new BadRequestException({
        success: false,
        message:
          'Provide tenant id in x-stencil-tenantid if the authorization key is tenant scoped',
      });
    }
    if (!uuid) {
      throw new BadRequestException({
        success: false,
        message: 'no id given',
      });
    }
    const application = await this.prismaService.application.findUnique({
      where: { id: uuid, name: data.name },
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
    const tenant = await this.prismaService.tenant.findUnique({
      where: { id: tenant_id },
    });
    if (!tenant) {
      throw new BadRequestException({
        success: false,
        message: 'No such tenant exists',
      });
    }
    const jwtConfiguration: JwtConfiguration = JSON.parse(tenant.data);
    const accessTokenSigningKeysId = jwtConfiguration.accessTokenSigningKeysID;
    const idTokenSigningKeysId = jwtConfiguration.idTokenSigningKeysID;
    if (
      !jwtConfiguration.refreshTokenTimeToLiveInMinutes ||
      !jwtConfiguration.timeToLiveInSeconds
    ) {
      throw new BadRequestException({
        success: false,
        message:
          'refreshTokenTimeToLiveInMinutes and timeToLiveInSeconds missing in jwtConfiguration',
      });
    }
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
    const configurations = JSON.stringify({
      oauthConfiguration: data.oauthConfiguration,
      jwtConfiguration: jwtConfiguration,
    });

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
          this.applicationRoles.createRole(
            value,
            application.id,
            null,
            headers,
          ),
        );
        scopes.forEach((value) =>
          this.applicationScopes.createScope(
            value,
            application.id,
            null,
            headers,
          ),
        );
      } catch (error) {
        this.logger.log('This is error while creating scopes/roles: ', error);
        throw new InternalServerErrorException({
          success: false,
          message: 'Error while creating new scope/roles',
        });
      }

      this.logger.log('New application registred!', application);

      res.send({
        success: true,
        message: 'Application created successfully!',
        data: application,
      });

      const publicKeys = await this.storePublicKeys(
        data.oauthConfiguration.authorizedOriginURLs,
        application.id,
      );
    } catch (error) {
      this.logger.log('Error occured in createApplication', error);
      throw new InternalServerErrorException({
        success: false,
        message: 'Error while creating new application',
      });
    }
  }

  // publicKeys set kr isme
  async patchApplication(
    id: string,
    newData: UpdateApplicationDto,
    headers: object,
    res: Response,
  ) {
    if (!id) {
      throw new BadRequestException({
        success: false,
        message: 'no id given',
      });
    }
    const valid = await this.headerAuthService.validateRoute(
      headers,
      '/application',
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

    const active =
      newData.active !== null ? newData.active : application.active;
    const oldApplicationData: ApplicationDataDto = JSON.parse(application.data);
    const newApplicationData: ApplicationDataDto = {
      jwtConfiguration: newData.jwtConfiguration,
      oauthConfiguration: newData.oauthConfiguration,
    };
    newApplicationData.jwtConfiguration = newApplicationData.jwtConfiguration
      ? newApplicationData.jwtConfiguration
      : oldApplicationData.jwtConfiguration;
    newApplicationData.oauthConfiguration =
      newApplicationData.oauthConfiguration
        ? newApplicationData.oauthConfiguration
        : oldApplicationData.oauthConfiguration;
    try {
      const application = await this.prismaService.application.update({
        where: { id },
        data: {
          name,
          tenantId: tenant_id,
          active,
          data: JSON.stringify(newApplicationData),
        },
      });
      res.send({
        success: true,
        message: 'Application updated successfully!',
        data: application,
      });
      const authorizedOriginURLS =
        newApplicationData.oauthConfiguration.authorizedOriginURLs;
      await this.prismaService.publicKeys.deleteMany({
        where: { applicationId: application.id },
      });
      await this.storePublicKeys(authorizedOriginURLS, application.id);
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
    const valid = await this.headerAuthService.validateRoute(
      headers,
      '/application',
      'GET',
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
    const valid = await this.headerAuthService.validateRoute(
      headers,
      '/application',
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
      const application = await this.prismaService.application.update({
        where: { id },
        data: { active: false },
      });
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
    const valid = await this.headerAuthService.validateRoute(
      headers,
      '/application',
      'GET',
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

  private async storePublicKeys(
    authorizedOriginURLS: string[],
    applicationId: string,
  ) {
    if (authorizedOriginURLS.length <= 0) {
      return null;
    }
    const result = await Promise.all(
      authorizedOriginURLS.map(async (url) => {
        try {
          const hostname = new URL(url).hostname;
          const pubKey = await this.utilService.getPublicKey(hostname);
          if (pubKey.success) return { pubKey: pubKey.data, hostname };
        } catch (error) {
          this.logger.error(`Error on ${url} while getting public key`);
        }
        return null;
      }),
    );
    const filterResults = result.filter((i) => i);
    const addPublicKeys = await Promise.all(
      filterResults.map(async (pubKey) => {
        return await this.prismaService.publicKeys.create({
          data: {
            hostname: pubKey.hostname,
            publicKey: pubKey.pubKey,
            applicationId,
          },
        });
      }),
    );
    return addPublicKeys;
  }
}
