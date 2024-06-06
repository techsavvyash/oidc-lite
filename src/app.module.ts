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
import { GroupsModule } from './groups/groups.module';
import { KeyModule } from './key/key.module';
import { KeyController } from './key/key.contoller';
import { KeyService } from './key/key.service';

@Module({
  imports: [OidcModule, UserModule, PrismaModule,JwtModule.register({
    global: true,
    secret: process.env.JWT_SECRET,
    signOptions: { expiresIn: process.env.JWT_SECRET_EXPIRATION },
  }), ApplicationModule, GroupsModule, KeyModule],
  controllers: [AppController, KeyController],
  providers: [AppService,UserService,PrismaService, KeyService],
})
export class AppModule {}
