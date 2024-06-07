import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { KeyController } from './key.contoller';
import { KeyService } from './key.service';
import { generateKeyDTO, updateDTO } from 'src/dto/key.dto';

@Module({
  controllers: [KeyController],
  providers: [KeyService,PrismaService, updateDTO, generateKeyDTO],
  exports : [updateDTO, generateKeyDTO]
})
export class KeyModule {}
