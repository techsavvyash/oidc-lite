import { ApiOperation, ApiProperty } from "@nestjs/swagger";
import {IsArray, IsString} from "class-validator"


export class grouupDTO{
    @ApiProperty() name : string
    @ApiProperty() description : string
}

export class createGroupDTO{
    @IsArray()
    @IsString({ each: true })
    roleIDs: string[]
    group : grouupDTO
}