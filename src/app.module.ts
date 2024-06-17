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
import { KeyModule } from './key/key.module';
import { GroupModule } from './groups/groups.module';
import { RefreshTokenModule } from './refresh_tokens/refreshtokens.module';
import { GroupUserModule } from './groupUser/gpUser.module';


@Module({
  imports: [OidcModule, UserModule, PrismaModule,JwtModule.register({
    global: true,
    secret: process.env.JWT_SECRET,
    signOptions: { expiresIn: process.env.JWT_SECRET_EXPIRATION },

    }), ApplicationModule,ScheduleModule.forRoot(), KeyModule, GroupModule,RefreshTokenModule, GroupUserModule],
    controllers: [AppController, TenantController],
    providers: [AppService,UserService,PrismaService, ApplicationRolesService, ApplicationScopesService, TenantService, MemoryMonitorService],

})
export class AppModule {}
