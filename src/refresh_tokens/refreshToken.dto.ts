import { ApiProperty } from "@nestjs/swagger";


export class refreshCookiesDTO{
    @ApiProperty() refreshToken : string
    @ApiProperty() token : string
}
export class refreshDTO{
    @ApiProperty() refreshToken : string
    @ApiProperty() token : string
}


