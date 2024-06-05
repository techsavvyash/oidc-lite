import { Module } from '@nestjs/common';
import { ApplicationController } from './application.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ApplicationController],
  providers: [PrismaService]
})
export class ApplicationModule {}
