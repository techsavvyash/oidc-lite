import { ApiProperty } from "@nestjs/swagger"


export class retrieveDTO{
    @ApiProperty() algorithm ?: string
    @ApiProperty() id ?: string
    @ApiProperty() kid ?: string
    @ApiProperty() name ?: string
    @ApiProperty() type ?: string
    @ApiProperty() createdAt ?:string
}

