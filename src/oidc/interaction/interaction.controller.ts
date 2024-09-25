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
import { PrismaService } from '../../prisma/prisma.service';
import { UserData } from '../../user/user.dto';
import { UtilsService } from '../../utils/utils.service';
import { ApplicationDataDto } from '../../application/application.dto';

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
    const clientData: ApplicationDataDto = JSON.parse(client.data);
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

    const { skipConsentScreen } = clientData.oauthConfiguration;
    const loginInstant = new Date();

    await interaction.finished(
      {
        login: {
          accountId: form.user,
        },
      },
      { mergeWithLastSubmission: false },
    );

    if (skipConsentScreen) {
      try {
        await this.prismaService.userRegistration.upsert({
          where: {
            user_registrations_uk_1: {
              usersId: user.id,
              applicationsId: client.id,
            },
          },
          update: {
            lastLoginInstant: loginInstant,
          },
          create: {
            applicationsId: client.id,
            password: userPassword,
            lastLoginInstant: loginInstant,
            usersId: user.id,
          },
        });
      } catch (error) {
        this.logger.error(
          'Error while upsert user registration in consent less login',
          error,
        );
      }
    }
  }

  // Doesn't run in consent less login or when aborted
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

    try {
      const userEmail = interactionDetails.session.accountId;
      const client_id = params.client_id as string;
      const user = await this.prismaService.user.findUnique({
        where: { email: userEmail },
      });
      const userData: UserData = JSON.parse(user.data);
      const userPassword = userData.userData.password;
      const loginInstant = new Date();
      await this.prismaService.userRegistration.upsert({
        where: {
          user_registrations_uk_1: {
            usersId: user.id,
            applicationsId: client_id,
          },
        },
        update: {
          lastLoginInstant: loginInstant,
        },
        create: {
          applicationsId: client_id,
          password: userPassword,
          lastLoginInstant: loginInstant,
          usersId: user.id,
        },
      });
    } catch (error) {
      this.logger.error(
        'Error while updating/creating user registration in consent login',
        error,
      );
    }
  }

  // runs only when aborted
  @Get(':uid/abort')
  async abortLogin(@Oidc.Interaction() interaction: InteractionHelper) {
    const result = {
      error: 'access_denied',
      error_description: 'End-user aborted interaction',
    };

    await interaction.finished(result, { mergeWithLastSubmission: false });
  }
}
