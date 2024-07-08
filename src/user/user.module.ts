import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRegistrationService } from './user-registration/user-registration.service';
import { HeaderAuthService } from '../header-auth/header-auth.service';
import { UtilsService } from '../utils/utils.service';

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    PrismaService,
    UserRegistrationService,
    HeaderAuthService,
    UtilsService,
  ],
})
export class UserModule {}
