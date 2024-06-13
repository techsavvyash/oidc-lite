import { Module } from '@nestjs/common';
import { OidcService } from './oidc.service';
import { OidcController } from './oidc.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [OidcService,PrismaService],
  controllers: [OidcController]
})
export class OidcModule {}
