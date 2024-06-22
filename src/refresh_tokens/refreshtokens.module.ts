import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RefreshTokensController } from './refreshtokens.controller';
import { RefreshTokensService } from './refreshtokens.service';
import { refreshCookiesDTO, refreshDTO } from './refreshToken.dto';
import { HeaderAuthService } from 'src/header-auth/header-auth.service';

@Module({
  controllers: [RefreshTokensController],
  providers: [
    RefreshTokensService,
    PrismaService,
    refreshCookiesDTO,
    refreshDTO,
    HeaderAuthService,
  ],
  exports: [refreshCookiesDTO, refreshDTO],
})
export class RefreshTokenModule {}
