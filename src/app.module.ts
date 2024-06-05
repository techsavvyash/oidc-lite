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

@Module({
  imports: [OidcModule, UserModule, PrismaModule,JwtModule.register({
    global: true,
    secret: process.env.JWT_SECRET,
    signOptions: { expiresIn: process.env.JWT_SECRET_EXPIRATION },
  }), ApplicationModule],
  controllers: [AppController],
  providers: [AppService,UserService,PrismaService, ApplicationRolesService, ApplicationScopesService, TenantService],
})
export class AppModule {}
