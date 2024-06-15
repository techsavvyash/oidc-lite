import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { generateKeyDTO, updateDTO } from 'src/key/key.dto';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { createGroupDTO } from './groups.dto';
import { TenantService } from 'src/tenant/tenant.service';

@Module({
  controllers: [GroupsController],
  providers: [GroupsService,PrismaService, createGroupDTO, TenantService],
  exports : [createGroupDTO]
})
export class GroupModule {}
