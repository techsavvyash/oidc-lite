import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user';
import { UserController } from './user.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtModule, JwtService } from '@nestjs/jwt';

@Module({
  imports: [JwtModule],
  providers: [UserService, User,PrismaService,JwtService],
  controllers: [UserController],
})
export class UserModule {}
