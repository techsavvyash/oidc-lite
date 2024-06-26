import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OidcModule } from './oidc/oidc.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserService } from './user/user.service';
import { PrismaService } from './prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { ApplicationModule } from './application/application.module';
import { ApplicationRolesService } from './application/application-roles/application-roles.service';
import { ApplicationScopesService } from './application/application-scopes/application-scopes.service';
import { TenantService } from './tenant/tenant.service';
import { MemoryMonitorService } from './memory-monitor/memory-monitor.service';
import { ScheduleModule } from '@nestjs/schedule';
import { TenantController } from './tenant/tenant.controller';
import { ApiKeysController } from './api-keys/api-keys.controller';
import { ApiKeysService } from './api-keys/api-keys.service';
import { UserRegistrationService } from './user/user-registration/user-registration.service';
import { HeaderAuthService } from './header-auth/header-auth.service';
import { KeyModule } from './key/key.module';
import { GroupModule } from './groups/groups.module';
import { RefreshTokenModule } from './refresh_tokens/refreshtokens.module';
import { LoginModule } from './login/login.module';
import { KeyService } from './key/key.service';
import { TestUsersController } from './test-users/test-users.controller';
import { TestUsersService } from './test-users/test-users.service';
import { DomainPinningService } from './domain-pinning/domain-pinning.service';
import { OtpService } from './otp/otp.service';
import { OtpController } from './otp/otp.controller';
import { OtpModule } from './otp/otp.module';
import { OtpAdaptersService } from './otp/otp-adapters/otp-adapters.service';
import { OtpManagerService } from './otp/otp-manager/otp-manager.service';

@Module({
  imports: [
    OidcModule,
    UserModule,
    PrismaModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_SECRET_EXPIRATION },
    }),
    ApplicationModule,
    ScheduleModule.forRoot(),
    KeyModule,
    RefreshTokenModule,
    LoginModule, GroupModule,
    GroupModule,
    OtpModule,
  ],
  controllers: [
    AppController,
    TenantController,
    ApiKeysController,
    TestUsersController,
    OtpController,
  ],
  providers: [
    AppService,
    UserService,
    PrismaService,
    ApplicationRolesService,
    ApplicationScopesService,
    TenantService,
    MemoryMonitorService,
    ApiKeysService,
    UserRegistrationService,
    HeaderAuthService,
    KeyService,
    TestUsersService,
    DomainPinningService,
    OtpService,
    OtpAdaptersService,
    OtpManagerService
  ],
})
export class AppModule {}
