import { Module } from '@nestjs/common';
import { OidcConfigService } from './oidc-config.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [],
  providers: [OidcConfigService, PrismaService],
  exports: [OidcConfigService],
})
export class OidcConfigModule {}
