import { Module } from '@nestjs/common';
import { OidcController } from './oidc.controller';
import { OidcService } from './oidc.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [OidcController],
  providers: [OidcService,PrismaService]
})
export class OidcModule {}
