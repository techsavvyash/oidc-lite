import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Res,
} from '@nestjs/common';
import { Oidc, InteractionHelper } from 'nest-oidc-provider';
import { Response } from 'express';
import { Provider } from 'oidc-provider';
import { OIDCService } from '../oidc.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserData, UserDataDto } from 'src/user/user.dto';
import { UtilsService } from 'src/utils/utils.service';

/**
 * !!! This is just for example, don't use this in any real case !!!
 */
@Controller('/interaction')
export class InteractionController {
  private readonly logger = new Logger(InteractionController.name);
  private provider: Provider;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly utilsService: UtilsService,
  ) {}

  @Get(':uid')
  async login(
    @Oidc.Interaction() interaction: InteractionHelper,
    @Res() res: Response,
  ) {
    const { prompt, params, uid } = await interaction.details();
    this.provider = await OIDCService.getProvider();
    const client = await this.provider.Client.find(params.client_id as string);

    res.render(prompt.name, {
      details: prompt.details,
      client,
      params,
      uid,
    });
  }

  @Post(':uid')
  async loginCheck(
    @Oidc.Interaction() interaction: InteractionHelper,
    @Body() form: Record<string, string>,
  ) {
    const { prompt, params, uid } = await interaction.details();

    if (!form.user || !form.password) {
      throw new BadRequestException('missing credentials');
    }

    if (prompt.name !== 'login') {
      throw new BadRequestException('invalid prompt name');
    }
    const { client_id } = params;

    const client = await this.prismaService.application.findUnique({
      where: { id: client_id as string },
    });
    if (!client) {
      return await interaction.finished(
        {
          error: 'invalid client_id',
          error_description: 'client with given client_id not found',
        },
        { mergeWithLastSubmission: false },
      );
    }
    const user = await this.prismaService.user.findUnique({
      where: { email: form.user },
    });
    if (!user) {
      return await interaction.finished(
        {
          error: 'invalid_userid',
          error_description: 'user with given user id not found',
        },
        { mergeWithLastSubmission: false },
      );
    }
    const userData: UserData = JSON.parse(user.data);
    const userPassword = userData.userData.password;
    if (
      (await this.utilsService.comparePasswords(
        form.password,
        userPassword,
      )) === false
    ) {
      return await interaction.finished(
        {
          error: 'invalid authentication',
          error_description: 'either username or password incorrect',
        },
        { mergeWithLastSubmission: false },
      );
    }

    this.logger.debug(`Login UID: ${uid}`);
    this.logger.debug(`Login user: ${form.user}`);
    this.logger.debug(`Client ID: ${params.client_id}`);

    await interaction.finished(
      {
        login: {
          accountId: form.user,
        },
      },
      { mergeWithLastSubmission: false },
    );
  }

  @Post(':uid/confirm')
  async confirmLogin(@Oidc.Interaction() interaction: InteractionHelper) {
    const interactionDetails = await interaction.details();
    const { prompt, params, session } = interactionDetails;
    let { grantId } = interactionDetails;
    this.provider = await OIDCService.getProvider();

    const grant = grantId
      ? await this.provider.Grant.find(grantId)
      : new this.provider.Grant({
          accountId: session.accountId,
          clientId: params.client_id as string,
        });

    if (prompt.details.missingOIDCScope) {
      const scopes = prompt.details.missingOIDCScope as string[];
      grant.addOIDCScope(scopes.join(' '));
    }

    if (prompt.details.missingOIDCClaims) {
      grant.addOIDCClaims(prompt.details.missingOIDCClaims as string[]);
    }

    if (prompt.details.missingResourceScopes) {
      for (const [indicator, scopes] of Object.entries(
        prompt.details.missingResourceScopes,
      )) {
        grant.addResourceScope(indicator, scopes.join(' '));
      }
    }

    grantId = await grant.save();

    await interaction.finished(
      {
        consent: {
          grantId,
        },
      },
      { mergeWithLastSubmission: true },
    );
  }

  @Get(':uid/abort')
  async abortLogin(@Oidc.Interaction() interaction: InteractionHelper) {
    const result = {
      error: 'access_denied',
      error_description: 'End-user aborted interaction',
    };

    await interaction.finished(result, { mergeWithLastSubmission: false });
  }
}
