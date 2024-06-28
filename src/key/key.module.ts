import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { KeyController } from './key.contoller';
import { KeyService } from './key.service';
import { generateKeyDTO, updateDTO } from 'src/key/key.dto';
import { HeaderAuthService } from 'src/header-auth/header-auth.service';

@Module({
  controllers: [KeyController],
  providers: [
    KeyService,
    PrismaService,
    updateDTO,
    generateKeyDTO,
    HeaderAuthService,
  ],
  exports: [updateDTO, generateKeyDTO],
})
export class KeyModule {}
