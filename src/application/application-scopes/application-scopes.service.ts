import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ScopeDto, UpdateScopeDto } from 'src/dto/application.dto';
import { ResponseDto } from 'src/dto/response.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ApplicationScopesService {
  private readonly logger: Logger;
  constructor(private readonly prismaService: PrismaService) {
    this.logger = new Logger();
  }

  async createScope(
    data: ScopeDto,
    applicationsId: string,
    scopeId?: string,
  ): Promise<ResponseDto> {
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

  async getScope(applicationsId: string, id: string): Promise<ResponseDto> {
    if (!applicationsId) {
      throw new BadRequestException({
        success: false,
        message: 'No application id given',
      });
    }
    if (!id) {
      throw new BadRequestException({
        success: false,
        message: 'no id given to find scope',
      });
    }
    const application = await this.prismaService.application.findUnique({
      where: { id: applicationsId },
    });
    if (!application) {
      throw new BadRequestException({
        success: false,
        message: 'No application with the given id exists',
      });
    }
    const scope = await this.prismaService.applicationOauthScope.findUnique({
      where: {
        id,
        applicationsId,
      },
    });
    if (!scope) {
      throw new BadRequestException({
        success: false,
        message: 'Asked scope dont exists on given application',
      });
    }
    return {
      success: true,
      message: 'Scope found',
      data: scope,
    };
  }

  async updateScope(
    id: string,
    scopeId: string,
    data: UpdateScopeDto,
  ): Promise<ResponseDto> {
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
      throw new HttpException(
        'Error while updating scope',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteScope(id: string, scopeId: string): Promise<ResponseDto> {
    if (!id) {
      throw new BadRequestException({
        success: false,
        message: 'No application id provided',
      });
    }
    if (!scopeId) {
      throw new BadRequestException({
        success: false,
        message: 'No scope id provided',
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
