import { ApiOperation, ApiProperty } from "@nestjs/swagger";
import {IsArray, IsString} from "class-validator"


export class createGroupDTO{
    @IsArray()
    @IsString({ each: true })
    roleIDs: string[]
    name : string
    tenantId : string
}
