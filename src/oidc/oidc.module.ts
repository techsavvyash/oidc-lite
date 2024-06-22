import { Module } from '@nestjs/common';
import { OidcService } from './oidc.service';
import { OidcController } from './oidc.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { DomainPinningService } from 'src/domain-pinning/domain-pinning.service';

@Module({
  providers: [OidcService,PrismaService,DomainPinningService],
  controllers: [OidcController]
})
export class OidcModule {}
