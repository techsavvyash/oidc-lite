import { Module } from '@nestjs/common';
import { OidcController } from './oidc.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [OidcController],
  providers: [PrismaService]
})
export class OidcModule {}
