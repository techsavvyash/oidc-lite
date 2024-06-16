import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { generateKeyDTO, updateDTO } from 'src/key/key.dto';
import { GroupUserController } from './gpUser.controller';
import { GroupUserService } from './gpUser.service';
import { MembersDTO } from './gpUser.dto';

@Module({
  controllers: [GroupUserController],
  providers: [GroupUserService,PrismaService,MembersDTO],
  exports : [MembersDTO]
})
export class GroupUserModule {}
