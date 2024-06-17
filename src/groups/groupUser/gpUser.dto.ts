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



class idDto {
  @IsString()
  userId: string;
}
class memberDTO{
  @IsArray()
  @IsString()
  member : idDto[]
}
export class deleteMemberDTO{
  @Type(()=>memberDTO)
  members : memberDTO[]
}


// class memberDTO {
//   @IsString()
//   userId: string;
// }
// export class deleteMemberDTO{
//   @IsArray()
//   memberIds : memberDTO[]
// }