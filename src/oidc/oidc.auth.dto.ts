import { ApiProperty } from '@nestjs/swagger';

export class OIDCAuthQuery {
  @ApiProperty() client_id: string;
  @ApiProperty() redirect_uri: string;
  @ApiProperty() response_type: string;
  @ApiProperty() tenantId: string;
  @ApiProperty() scope: string;
}
