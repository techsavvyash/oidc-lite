import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { KeyController } from './key.contoller';
import { KeyService } from './key.service';
import { retrieveDTO } from 'src/dto/key.dto';

@Module({
  controllers: [KeyController],
  providers: [KeyService,PrismaService, retrieveDTO],
  exports : [retrieveDTO]
})
export class KeyModule {}
