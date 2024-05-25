import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OidcModule } from './oidc/oidc.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserService } from './user/user.service';
import { PrismaService } from './prisma/prisma.service';
import { ApiModule } from './api/api.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [OidcModule, UserModule, PrismaModule, ApiModule,JwtModule.register({
    global: true,
    secret: "secret",
    signOptions: { expiresIn: '1hs' },
  }),],
  controllers: [AppController],
  providers: [AppService,UserService,PrismaService],
})
export class AppModule {}
