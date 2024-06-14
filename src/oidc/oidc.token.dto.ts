import { ApiProperty } from '@nestjs/swagger';

export class TokenDto {
  @ApiProperty() client_id?: string;
  @ApiProperty() client_secret?: string;
  @ApiProperty() code: string;
  @ApiProperty() grant_type: string;
  @ApiProperty() redirect_uri: string;
}

export class IntrospectDto {
  @ApiProperty() client_id: string;
  @ApiProperty() client_secret: string;
  @ApiProperty() token: string;
}
