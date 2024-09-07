import { Module } from '@nestjs/common';
import { OidcController } from './oidc.controller';
import { OidcService } from './oidc.service';
import { OidcConfigService } from './oidc.config.service';
// import { DatabaseService } from './database.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaAdapter } from './oidc.adapter';

@Module({
  controllers: [OidcController],
  providers: [OidcService, OidcConfigService, PrismaService, PrismaAdapter],
})
export class OidcModule {}
