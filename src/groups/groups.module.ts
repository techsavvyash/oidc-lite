import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { createGroupDTO } from './dtos/groups.dto';
import { HeaderAuthService } from 'src/header-auth/header-auth.service';
import { GroupUserService } from 'src/groups/gpUser.service';
import { KeyService } from 'src/key/key.service';
import { GroupAppRoleService } from './group-Application-role/gpApplicationRole.service';

@Module({
  controllers: [GroupsController],
  providers: [
    GroupsService,
    GroupAppRoleService,
    PrismaService,
    createGroupDTO,
    GroupUserService,
    KeyService,
    HeaderAuthService,
  ],
  exports: [createGroupDTO],
})
export class GroupModule {}
