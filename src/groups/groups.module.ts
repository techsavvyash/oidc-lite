import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { createGroupDTO } from './dtos/groups.dto';
import { HeaderAuthService } from '../header-auth/header-auth.service';
import { GroupUserService } from './gpUser.service';
import { KeyService } from '../key/key.service';

@Module({
  controllers: [GroupsController],
  providers: [
    GroupsService,
    PrismaService,
    createGroupDTO,
    GroupUserService,
    KeyService,
    HeaderAuthService,
  ],
  exports: [createGroupDTO],
})
export class GroupModule {}
