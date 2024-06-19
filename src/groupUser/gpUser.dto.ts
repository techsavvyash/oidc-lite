import { IsUUID, IsObject, ValidateNested, IsString, IsArray, isArray } from 'class-validator';
import { Type } from 'class-transformer';


class UserIdDto {
  @IsString()
  userId: string;
}
class GPDTO{
  groupId : string
  @IsArray()
  @IsString()
  userIds : UserIdDto[]
}
export class addUserDTO{
  @IsArray()
  @Type(()=>GPDTO)
  members : GPDTO[]
}

export class deleteMemberDTO{
  @IsArray()
  @IsString()
  members : string[]
}