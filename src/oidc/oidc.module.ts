import { Module } from '@nestjs/common';
import { OidcController } from './oidc.controller';
import { OidcService } from './oidc.service';
import { OidcConfigService } from './oidc.config.service';
import { DatabaseService } from './database.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [OidcController],
  providers: [OidcService, OidcConfigService, DatabaseService,PrismaService],
})
export class OidcModule {}
