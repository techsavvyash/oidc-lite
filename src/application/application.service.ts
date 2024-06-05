import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ApplicationRolesService } from 'src/application/application-roles/application-roles.service';
import { ApplicationScopesService } from 'src/application/application-scopes/application-scopes.service';
import {
  CreateApplicationDto,
  UpdateApplicationDto,
} from 'src/dto/application.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { TenantService } from 'src/tenant/tenant.service';

@Injectable()
export class ApplicationService {
  private readonly logger: Logger;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly applicationRoles: ApplicationRolesService,
    private readonly applicationScopes: ApplicationScopesService,
    private readonly tenantService: TenantService,
  ) {
    this.logger = new Logger();
  }

  async createApplication(uuid: string, data: CreateApplicationDto) {
    try {
      if (!data.jwtConfiguration) {
        throw new BadRequestException({
          message:
            'jwt Configuration not provided. for now provide it in future will have a default field',
        });
      }
      const jwtConfiguration = data.jwtConfiguration;
      const accessTokenKeyID = jwtConfiguration.accessTokenKeyID;
      const idTokenKeyID = jwtConfiguration.idTokenKeyID;
      // using the above two we will create a new tenant or find it.
      const tenantId = (
        await this.tenantService.findTenantElseCreate(
          accessTokenKeyID,
          idTokenKeyID,
          data.tenant_id,
        )
      ).tenant.id;

      const active = data.active ? data.active : true;
      const name = data.name;
      const roles = data.roles;
      const scopes = data.scopes;

      const configurations = JSON.stringify(data.oauthConfiguration);

      try {
        const application = await this.prismaService.application.create({
          data: {
            id: uuid,
            active,
            accessTokenSigningKeysId: accessTokenKeyID,
            idTokenSigningKeysId: idTokenKeyID,
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
          console.log('This is error while creating scopes/roles: ', error);
          throw new HttpException(
            'Error making new roles/scopes',
            HttpStatus.BAD_REQUEST,
          );
        }

        this.logger.log('New application registred!', application);

        return {
          message: 'Application created successfully!',
          application,
        };
      } catch (error) {
        throw new HttpException(
          'Error making new application',
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      console.log('Error from createApplication: ', error);
      throw new HttpException(
        'Some unknown error happened',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async patchApplication(id: string, newData: UpdateApplicationDto) {
    if (!newData) {
      throw new HttpException('No updation data given', HttpStatus.BAD_REQUEST);
    }
    const application = await this.prismaService.application.findUnique({
      where: { id },
    });
    if (!application) {
      throw new HttpException(
        'Application with the provided id dont exist',
        HttpStatus.BAD_REQUEST,
      );
    }

    const name = newData.name ? newData.name : application.name;

    const tenantId = newData.tenant_id
      ? newData.tenant_id
      : application.tenantId;
    const jwtConfiguration = newData.jwtConfiguration
      ? newData.jwtConfiguration
      : null;
    const accessTokenKeyID = jwtConfiguration
      ? jwtConfiguration.accessTokenKeyID
      : application.accessTokenSigningKeysId;
    const idTokenKeyID = jwtConfiguration
      ? jwtConfiguration.idTokenKeyID
      : application.idTokenSigningKeysId;
    await this.tenantService.findTenantElseCreate(
      accessTokenKeyID,
      idTokenKeyID,
      tenantId,
    );

    const active = newData.active ? newData.active : application.active;
    const data = newData.oauthConfiguration
      ? JSON.stringify(newData.oauthConfiguration)
      : application.data;

    try {
      const application = await this.prismaService.application.update({
        where: { id },
        data: {
          name,
          tenantId,
          active,
          data,
        },
      });
      return {
        message: 'Application updated successfully!',
        application,
      };
    } catch (error) {
      console.log('Error from patchApplication', error);
      throw new HttpException(
        'Some unkown error happened!',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async returnAllApplications() {
    return await this.prismaService.application.findMany();
  }

  async returnAnApplication(id: string) {
    return await this.prismaService.application.findUnique({
      where: {
        id,
      },
    });
  }

  async deleteApplication(id: string, hardDelete: boolean) {
    if (hardDelete) {
      return await this.prismaService.application.delete({ where: { id } });
    } else {
      return await this.patchApplication(id, { active: false });
    }
  }

  async returnOauthConfiguration(id: string) {
    const application = await this.prismaService.application.findUnique({
      where: { id },
    });
    if (!application) {
      throw new HttpException(
        'No application with such id exists',
        HttpStatus.BAD_REQUEST,
      );
    }
    return {
      configurations: application.data,
    };
  }
}
