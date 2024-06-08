import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ApplicationRolesService } from 'src/application/application-roles/application-roles.service';
import { ApplicationScopesService } from 'src/application/application-scopes/application-scopes.service';
import {
  CreateApplicationDto,
  UpdateApplicationDto,
} from 'src/dto/application.dto';
import { ResponseDto } from 'src/dto/response.dto';
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

  async createApplication(
    uuid: string,
    data: CreateApplicationDto,
  ): Promise<ResponseDto> {
    const application = await this.prismaService.application.findUnique({
      where: { id: uuid },
    });
    if (application) {
      throw new BadRequestException({
        success: false,
        message: 'Application with the provided id already exists',
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
        this.logger.log('This is error while creating scopes/roles: ', error);
        throw new InternalServerErrorException({
          success: false,
          message: 'Error while creating new scop/roles',
        });
      }

      this.logger.log('New application registred!', application);

      return {
        success: true,
        message: 'Application created successfully!',
        data: application,
      };
    } catch (error) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Error while creating new application',
      });
    }
  }

  async patchApplication(
    id: string,
    newData: UpdateApplicationDto,
  ): Promise<ResponseDto> {
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

  async returnAllApplications(): Promise<ResponseDto> {
    const allApplications = await this.prismaService.application.findMany();
    return {
      success: true,
      message: 'All applications found',
      data: allApplications,
    };
  }

  async returnAnApplication(id: string): Promise<ResponseDto> {
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
    if (!application) {
      throw new BadRequestException({
        success: false,
        message: 'Application with the given id dont exist',
      });
    }
    return {
      success: true,
      message: 'Application found successfully',
      data: application,
    };
  }

  async deleteApplication(
    id: string,
    hardDelete: boolean,
  ): Promise<ResponseDto> {
    if (hardDelete) {
      try {
        const application = await this.prismaService.application.delete({
          where: { id },
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
      const application = await this.patchApplication(id, { active: false });
      return {
        success: true,
        message: 'Application soft deleted/inactive',
        data: application,
      };
    }
  }

  async returnOauthConfiguration(id: string): Promise<ResponseDto> {
    const application = await this.prismaService.application.findUnique({
      where: { id },
    });
    if (!application) {
      throw new BadRequestException({
        success: false,
        message: 'No application with the given id exists',
      });
    }
    return {
      success: true,
      message: "Application's configurations are as follows",
      data: JSON.parse(application.data),
    };
  }
}
