import { ApiProperty } from "@nestjs/swagger"


export class updateDTO{
    @ApiProperty() name : string
}


export class generateKeyDTO{
    @ApiProperty() algorithm : string
    @ApiProperty() issuer : string
    @ApiProperty() name : string
    @ApiProperty() length : string
}
