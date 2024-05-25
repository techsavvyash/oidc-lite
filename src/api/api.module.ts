import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [ApiController],
  providers: [PrismaService,UserService,JwtService],
})
export class ApiModule {}
