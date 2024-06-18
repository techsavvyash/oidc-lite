import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { generateKeyDTO, updateDTO } from 'src/key/key.dto';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { createGroupDTO } from './groups.dto';
import { GroupUserService } from './groupUser/gpUser.service';

@Module({
  controllers: [GroupsController],
  providers: [GroupUserService, GroupsService, PrismaService, createGroupDTO],
  exports: [createGroupDTO]
})
export class GroupModule { }
