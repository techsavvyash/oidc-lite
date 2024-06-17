import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { generateKeyDTO, updateDTO } from 'src/key/key.dto';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { createGroupDTO } from './groups.dto';
import { GroupUserService } from './groupUser/gpUser.service';
import { GroupUserController } from './groupUser/gpUser.controller';
import { addUserDTO, deleteMemberDTO } from './groupUser/gpUser.dto';

@Module({
  controllers: [GroupUserController,GroupsController],
  providers: [GroupUserService, GroupsService,PrismaService,createGroupDTO, addUserDTO, deleteMemberDTO],
  exports : [createGroupDTO, addUserDTO, deleteMemberDTO]
})
export class GroupModule {}
