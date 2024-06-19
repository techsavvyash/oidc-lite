import { ApiOperation, ApiProperty } from "@nestjs/swagger";
import {IsArray, IsString} from "class-validator"


export class createGroupDTO{
    @IsArray()
    @IsString({ each: true })
    roleIDs: string[]
    name : string
    tenantId : string
}

export class RoleDto {
    @ApiProperty() description: string;
    @ApiProperty() isDefault: boolean;
    @ApiProperty() isSuperRole: boolean;
    @ApiProperty() name: string;
    @ApiProperty() id?: string;
  }