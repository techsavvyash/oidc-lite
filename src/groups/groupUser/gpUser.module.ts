import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { generateKeyDTO, updateDTO } from 'src/key/key.dto';
import { GroupUserController } from './gpUser.controller';
import { GroupUserService } from './gpUser.service';
import { addUserDTO } from './gpUser.dto';

@Module({
  controllers: [GroupUserController],
  providers: [GroupUserService,PrismaService,addUserDTO,],
  exports : [addUserDTO, ]
})
export class GroupUserModule {}
