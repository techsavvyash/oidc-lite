import { Module } from '@nestjs/common';
import { OidcModule } from 'nest-oidc-provider';
import { OidcConfigModule } from './config/oidc-config.module';
import { OidcConfigService } from './config/oidc-config.service';
import { OIDCController } from './oidc.controller';
import { InteractionModule } from './interaction/interaction.module';
import { OIDCService } from './oidc.service';
import { PrismaService } from '../prisma/prisma.service';
import { UtilsService } from '../utils/utils.service';

@Module({
  imports: [
    OidcModule.forRootAsync({
      imports: [OidcConfigModule],
      useExisting: OidcConfigService,
    }),
    InteractionModule,
  ],
  providers: [OIDCService, PrismaService,UtilsService],
  controllers: [OIDCController],
})
export class OIDCModule {}
