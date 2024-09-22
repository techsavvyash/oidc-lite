import { Module } from '@nestjs/common';
import { InteractionController } from './interaction.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { UtilsService } from 'src/utils/utils.service';

@Module({
  controllers: [InteractionController],
  providers: [PrismaService, UtilsService],
})
export class InteractionModule {}
