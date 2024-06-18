import { ApiOperation, ApiProperty } from "@nestjs/swagger";
import {IsArray, IsString, IsUUID, IsObject, ValidateNested } from "class-validator"
import { Type } from 'class-transformer';


export class createGroupDTO{
    @IsArray()
    @IsString({ each: true })
    roleIDs: string[]
    name : string
    tenantId : string
}

// group user dto 
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
  