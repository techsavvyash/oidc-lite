import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ApplicationRolesService } from 'src/application/application-roles/application-roles.service';
import { ApplicationScopesService } from 'src/application/application-scopes/application-scopes.service';
import { CreateApplicationDto } from 'src/dto/application.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { TenantService } from 'src/tenant/tenant.service';

@Injectable()
export class ApplicationService {
  private readonly logger: Logger;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly applicationRoles: ApplicationRolesService,
    private readonly applicationScopes: ApplicationScopesService,
    private readonly tenantService: TenantService
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
      const tenantId = (await (await this.tenantService.findTenantElseCreate(accessTokenKeyID,idTokenKeyID)).tenant).id;

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
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async patchApplication(id: string, newData: any) {}

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
}
