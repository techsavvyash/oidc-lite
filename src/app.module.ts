import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { PrismaService } from './prisma/prisma.service';
import { ApplicationModule } from './application/application.module';
import { MemoryMonitorService } from './memory-monitor/memory-monitor.service';
import { KeyModule } from './key/key.module';
import { GroupModule } from './groups/groups.module';
import { KickstartModule } from './kickstart/kickstart.module';
import { OtpModule } from './otp/otp.module';
import { TenantModule } from './tenant/tenant.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { UtilsService } from './utils/utils.service';
import { OIDCModule } from './oidc/oidc.module';
import { InteractionController } from './oidc/interaction/interaction.controller';
import { OIDCService } from './oidc/oidc.service';

@Module({
  imports: [
    OIDCModule,
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
    GroupModule,
    KickstartModule,
    OtpModule,
    TenantModule,
    ApiKeysModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController, InteractionController],
  providers: [
    AppService,
    PrismaService,
    MemoryMonitorService,
    UtilsService,
    // OIDCService,
  ],
})
export class AppModule {}
