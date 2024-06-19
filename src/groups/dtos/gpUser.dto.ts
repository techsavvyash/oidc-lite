import { IsUUID, IsObject, ValidateNested, IsString, IsArray, isArray } from 'class-validator';
import { Type } from 'class-transformer';

class GPDTO{
  groupId : string
  @IsArray()
  @IsString()
  userIds : string[]
}
export class  addUserDTO{
  @IsArray()
  @Type(()=>GPDTO)
  members : GPDTO[]
}

export class deleteMemberDTO{
  @IsArray()
  @IsString()
  members : string[]
}