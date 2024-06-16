import { ApiProperty } from "@nestjs/swagger"


export class updateDTO{
@ApiProperty() algorithm : string
@ApiProperty() issuer : string
@ApiProperty() name : string
@ApiProperty() length : string
}


export class generateKeyDTO{
@ApiProperty() algorithm : string
@ApiProperty() issuer : string
@ApiProperty() name : string
@ApiProperty() length : string
}