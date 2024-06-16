import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { generateKeyDTO, updateDTO } from 'src/key/key.dto';
import { GroupUserController } from './gpUser.controller';
import { GroupUserService } from './gpUser.service';
import { addUserDTO, deleteMemberDTO } from './gpUser.dto';

@Module({
  controllers: [GroupUserController],
  providers: [GroupUserService,PrismaService,addUserDTO, deleteMemberDTO],
  exports : [addUserDTO, deleteMemberDTO]
})
export class GroupUserModule {}
