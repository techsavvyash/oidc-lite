import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRegistrationService } from './user-registration/user-registration.service';

@Module({
  controllers: [UserController],
  providers: [UserService,PrismaService,UserRegistrationService]
})
export class UserModule {}
