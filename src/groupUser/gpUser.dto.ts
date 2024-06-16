import { IsUUID, IsObject, ValidateNested, IsString, IsArray } from 'class-validator';
import { Type } from 'class-transformer';


class UserIdDto {
  @IsString()
  userId: string;
}

class GroupMembersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserIdDto)
  members: UserIdDto[];
}
export class MembersDTO {
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => Object)
  members: Record<string, GroupMembersDto[]>;
}