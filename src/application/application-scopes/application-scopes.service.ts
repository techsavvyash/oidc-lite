import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ApplicationDataDto, ScopeDto, UpdateScopeDto } from '../application.dto';
import { ResponseDto } from '../../dto/response.dto';
import { HeaderAuthService } from '../../header-auth/header-auth.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApplicationScopesService {
  private readonly logger: Logger;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly headerAuthService: HeaderAuthService,
  ) {
    this.logger = new Logger(ApplicationScopesService.name);
  }

  async createScope(
    data: ScopeDto,
    applicationsId: string,
    scopeId: string,
    headers: object,
  ): Promise<ResponseDto> {
    const valid = await this.headerAuthService.validateRoute(
      headers,
      '/application/scope',
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
    if (!data) {
      throw new BadRequestException({
        success: false,
        message: 'no data given for scope creation',
      });
    }
    if (!applicationsId) {
      throw new BadRequestException({
        success: false,
        message: 'no application id given for scope creation',
      });
    }
    const application = await this.prismaService.application.findUnique({
      where: { id: applicationsId },
    });
    if (!application) {
      throw new BadRequestException({
        success: false,
        message: 'Application with the provided id dont exist',
      });
    }
    if (application.tenantId !== tenant_id && valid.data.tenantsId !== null) {
      throw new UnauthorizedException({
        success: false,
        message: 'You are not authorized enough',
      });
    }

    let id = null;
    if (data.id) {
      id = data.id;
    } else if (scopeId) {
      id = scopeId;
    } else {
      id = randomUUID();
    }
    const { defaultConsentDetail, defaultConsentMessage, name, required } =
      data;
    const description = JSON.stringify({
      defaultConsentDetail,
      defaultConsentMessage,
    });
    try {
      const newScope = await this.prismaService.applicationOauthScope.create({
        data: {
          id,
          description,
          name,
          applicationsId,
        },
      });
      this.logger.log('New scope added!', newScope);
      return {
        success: true,
        message: 'successfully created a new scope',
        data: newScope,
      };
    } catch (error) {
      this.logger.log('Error creating a new Scope', error);
      throw new InternalServerErrorException({
        success: false,
        message: 'error creating the Scope',
      });
    }
  }


  async updateScope(
    id: string,
    scopeId: string,
    data: UpdateScopeDto,
    headers: object,
  ): Promise<ResponseDto> {
    const valid = await this.headerAuthService.validateRoute(
      headers,
      '/application/scope',
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
    if (!data) {
      throw new BadRequestException({
        success: false,
        message: 'no data given for scope creation',
      });
    }
    if (!id) {
      throw new BadRequestException({
        success: false,
        message: 'id given for scope creation',
      });
    }
    const application = await this.prismaService.application.findUnique({
      where: { id },
    });
    if (!application) {
      throw new BadRequestException({
        success: false,
        message: 'no Application with the given id exists',
      });
    }
    if (application.tenantId !== tenant_id && valid.data.tenantsId !== null) {
      throw new UnauthorizedException({
        success: false,
        message: 'You are not authorized enough',
      });
    }
    try {
      const oldScope =
        await this.prismaService.applicationOauthScope.findUnique({
          where: { id: scopeId, applicationsId: id },
        });
      const name = data.name ? data.name : oldScope.name;

      const oldDesc = JSON.parse(oldScope.description);
      const defaultConsentDetail = data.defaultConsentDetail
        ? data.defaultConsentDetail
        : oldDesc.defaultConsentDetail;
      const defaultConsentMessage = data.defaultConsentMessage
        ? data.defaultConsentMessage
        : oldDesc.defaultConsentMessage;
      const description = JSON.stringify({
        defaultConsentDetail,
        defaultConsentMessage,
      });
      console.log(description, " is the description")
      console.log(name, " is the name")
      const scope = await this.prismaService.applicationOauthScope.update({
        where: { id: scopeId },
        data: {
          description,
          name,
        },
      });
      this.logger.log('scope updated', scope);
      return {
        success: true,
        message: 'scope updated successfully',
        data: scope,
      };
    } catch (error) {
      this.logger.log('Error occured while updating scope', error);
      throw new InternalServerErrorException({
        success: false,
        message: 'Error while updating scope'
      });
    }
  }

  async deleteScope(
    id: string,
    scopeId: string,
    headers: object,
  ): Promise<ResponseDto> {
    const valid = await this.headerAuthService.validateRoute(
      headers,
      '/application/scope',
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
    if (!id) {
      throw new BadRequestException({
        success: false,
        message: 'No application id provided',
      });
    }
    const application = await this.prismaService.application.findUnique({
      where: { id },
    });
    if (!application) {
      throw new BadRequestException({
        success: false,
        message: 'no application with given id exists',
      });
    }
    if (!scopeId) {
      throw new BadRequestException({
        success: false,
        message: 'No scope id provided',
      });
    }
    if (application.tenantId !== tenant_id && valid.data.tenantsId !== null) {
      throw new UnauthorizedException({
        success: false,
        message: 'You are not authorized enough',
      });
    }
    try {
      const scope = await this.prismaService.applicationOauthScope.delete({
        where: { id: scopeId, applicationsId: id },
      });
      return {
        success: true,
        message: 'Scope deleted successfully',
        data: scope,
      };
    } catch (error) {
      this.logger.log('Error from deleteScope', error);
      throw new InternalServerErrorException({
        success: false,
        message: 'Some error occured while deleting the scope',
      });
    }
  }
}
