import { IsUUID, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class MemberDTO {
  @IsUUID()
  userId: string;
}
export class MembersDTO {
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => MemberDTO)
  
  members: Record<string, MemberDTO[]>;
}