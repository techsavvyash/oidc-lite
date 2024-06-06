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
<<<<<<< HEAD
import { GroupsModule } from './groups/groups.module';
import { KeyModule } from './key/key.module';
import { KeyController } from './key/key.contoller';
import { KeyService } from './key/key.service';
=======
import { ApplicationRolesService } from './application/application-roles/application-roles.service';
import { ApplicationScopesService } from './application/application-scopes/application-scopes.service';
import { TenantService } from './tenant/tenant.service';
import { MemoryMonitorService } from './memory-monitor/memory-monitor.service';
import { ScheduleModule } from '@nestjs/schedule';
import { TenantController } from './tenant/tenant.controller';
>>>>>>> 842c6e6da6bc8e17e231327232c0339697f8145e

@Module({
  imports: [OidcModule, UserModule, PrismaModule,JwtModule.register({
    global: true,
    secret: process.env.JWT_SECRET,
    signOptions: { expiresIn: process.env.JWT_SECRET_EXPIRATION },
<<<<<<< HEAD
  }), ApplicationModule, GroupsModule, KeyModule],
  controllers: [AppController, KeyController],
  providers: [AppService,UserService,PrismaService, KeyService],
=======
  }), ApplicationModule,ScheduleModule.forRoot()],
  controllers: [AppController, TenantController],
  providers: [AppService,UserService,PrismaService, ApplicationRolesService, ApplicationScopesService, TenantService, MemoryMonitorService],
>>>>>>> 842c6e6da6bc8e17e231327232c0339697f8145e
})
export class AppModule {}
