import { ApiProperty } from '@nestjs/swagger';

export class OIDCAuthQuery {
  @ApiProperty() client_id: string;
  @ApiProperty() redirect_uri: string;
  @ApiProperty() response_type: string;
  @ApiProperty() tenantId: string;
  @ApiProperty() scope: string;
  @ApiProperty() state: string;
  @ApiProperty() code_challenge: string;
  @ApiProperty() code_challenge_method: string;
}
