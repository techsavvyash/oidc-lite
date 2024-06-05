import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ScopeDto } from 'src/dto/application.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ApplicationScopesService {
  private readonly logger: Logger;
  constructor(private readonly prismaService: PrismaService) {
    this.logger = new Logger();
  }

  async createScope(data: ScopeDto, applicationsId: string) {
    const application = await this.prismaService.application.findUnique({
      where: { id: applicationsId },
    });
    if (!application) {
      throw new HttpException(
        'Application with provided id dont exist',
        HttpStatus.BAD_REQUEST,
      );
    }

    const id = data.id ? data.id : randomUUID();
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
          applicationsId
        },
      });
      this.logger.log("New scope added!",newScope);
      return {
        message: "successfully created a new scope",
        scope: newScope,
        applicationsId
      }
    } catch (error) {
      this.logger.log('Error creating a new Scope', error);
      return {
        message: 'error creating the Scope',
        scope: data,
      };
    }
  }

  async getScope() {}

  async updateScope() {}
}
