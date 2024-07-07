import {
  IsString,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class GPDTO {
  @ApiProperty()
  groupId: string;
  @IsArray()
  @IsString()
  userIds: string[];
}
export class addUserDTO {
  @ApiProperty()
  @IsArray()
  @Type(() => GPDTO)
  members: GPDTO[];
}

export class deleteMemberDTO {
  @ApiProperty()
  @IsArray()
  @IsString()
  members: string[];
}
