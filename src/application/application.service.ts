import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import axios from 'axios';
import { randomUUID } from 'crypto';
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
    this.logger = new Logger(ApplicationService.name);
  }

  async createApplication(
    uuid: string,
    data: CreateApplicationDto,
  ): Promise<ResponseDto> {
    if (!uuid) {
      throw new BadRequestException({
        success: false,
        message: 'no id given',
      });
    }
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
    // creating a new tenant based on given tenant id
    try {
      const tenant = await axios.post(
        `${process.env.HOST_NAME}:${process.env.HOST_PORT}/tenant/${data.tenant_id}`,
        {
          data: {
            name: randomUUID(),
            jwtConfiguration: jwtConfiguration,
          },
        },
      );
      const active = data.active ? data.active : true;
      const name = data.name;
      const roles = data.roles;
      const scopes = data.scopes;
      const tenantId = tenant.data.tenant.id;
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
        this.logger.log('Error occured in createApplication', error);
        throw new InternalServerErrorException({
          success: false,
          message: 'Error while creating new application',
        });
      }
    } catch (error) {
      this.logger.log('Error creating the tenant', error);
      throw new InternalServerErrorException({
        success: false,
        message: 'Sorry the tenant with given id cant be created',
      });
    }
  }

  async patchApplication(
    id: string,
    newData: UpdateApplicationDto,
  ): Promise<ResponseDto> {
    if (!id) {
      throw new BadRequestException({
        success: false,
        message: 'no id given',
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
    if (newData.tenant_id && !newData.jwtConfiguration) {
      throw new BadRequestException({
        success: false,
        message: 'jwt configurations not sent',
      });
    }
    const name = newData.name ? newData.name : application.name;

    const tenantId = newData.tenant_id
      ? newData.tenant_id
      : application.tenantId;
    const jwtConfiguration = newData.jwtConfiguration
      ? newData.jwtConfiguration
      : null;
    if (tenantId !== application.tenantId) {
      const tenant = await axios.post(
        `${process.env.HOST_NAME}:${process.env.HOST_PORT}/tenant/${tenantId}`,
        {
          data: {
            name: randomUUID(),
            jwtConfiguration: jwtConfiguration,
          },
        },
      );
    }

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
    return {
      success: true,
      message: 'Application found successfully',
      data: { application, scopes, roles },
    };
  }

  async deleteApplication(
    id: string,
    hardDelete: boolean,
  ): Promise<ResponseDto> {
    if (hardDelete) {
      try {
        const oldApplication = await this.prismaService.application.findUnique({
          where: { id },
        });
        if (!oldApplication) {
          throw new BadRequestException({
            success: false,
            message: 'Application with given id dont exist',
          });
        }
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
      const application = await this.patchApplication(id, { active: false });
      return {
        success: true,
        message: 'Application soft deleted/inactive',
        data: application,
      };
    }
  }

  async returnOauthConfiguration(id: string): Promise<ResponseDto> {
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
    return {
      success: true,
      message: "Application's configurations are as follows",
      data: JSON.parse(application.data),
    };
  }
}
