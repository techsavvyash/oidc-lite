import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { generateKeyDTO, updateDTO } from 'src/key/key.dto';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { createGroupDTO } from './dtos/groups.dto';
import { HeaderAuthService } from 'src/header-auth/header-auth.service';
import { GroupUserService } from 'src/groups/gpUser.service';

@Module({
  controllers: [GroupsController],
  providers: [GroupsService,PrismaService,createGroupDTO,HeaderAuthService,GroupUserService],
  exports : [createGroupDTO]
})
export class GroupModule {}
