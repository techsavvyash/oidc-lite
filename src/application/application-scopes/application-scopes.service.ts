import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ScopeDto, UpdateScopeDto } from 'src/application/application.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ApplicationScopesService {
  private readonly logger: Logger;
  constructor(private readonly prismaService: PrismaService) {
    this.logger = new Logger();
  }

  async createScope(data: ScopeDto, applicationsId: string, scopeId?: string) {
    const application = await this.prismaService.application.findUnique({
      where: { id: applicationsId },
    });
    if (!application) {
      throw new HttpException(
        'Application with provided id dont exist',
        HttpStatus.BAD_REQUEST,
      );
    }

    const id = data.id ? data.id : scopeId ? scopeId : randomUUID();
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
        message: 'successfully created a new scope',
        scope: newScope,
        applicationsId,
      };
    } catch (error) {
      this.logger.log('Error creating a new Scope', error);
      return {
        message: 'error creating the Scope',
        scope: data,
      };
    }
  }

  async getScope() {}

  async updateScope(id: string, scopeId: string, data: UpdateScopeDto) {
    if (!data) {
      throw new HttpException('No updation data given', HttpStatus.BAD_REQUEST);
    }
    const application = await this.prismaService.application.findUnique({
      where: { id },
    });
    if (!application) {
      throw new HttpException(
        "Application with given id don't exist",
        HttpStatus.BAD_REQUEST,
      );
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
        message: 'scope updated successfully',
        scope,
      };
    } catch (error) {
      console.log('Error occured while updating scope', error);
      throw new HttpException(
        'Error while updating scope',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteScope(id: string, scopeId: string) {
    return await this.prismaService.applicationOauthScope.delete({
      where: { id: scopeId, applicationsId: id },
    });
  }
}
