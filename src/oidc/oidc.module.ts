import { Module } from '@nestjs/common';
import { OidcService } from './oidc.service';
import { OidcController } from './oidc.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { UtilsService } from 'src/utils/utils.service';

@Module({
  providers: [OidcService, PrismaService, UtilsService],
  controllers: [OidcController],
})
export class OidcModule {}
