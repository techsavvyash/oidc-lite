import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRegistrationService } from './user-registration/user-registration.service';
import { HeaderAuthService } from 'src/header-auth/header-auth.service';
import { DomainPinningService } from 'src/domain-pinning/domain-pinning.service';
import { UtilsService } from 'src/utils/utils.service';

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    PrismaService,
    UserRegistrationService,
    HeaderAuthService,
    DomainPinningService,
    UtilsService,
  ],
})
export class UserModule {}
