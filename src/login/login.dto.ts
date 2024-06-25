import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty() loginId: string;
  @ApiProperty() password: string;
  @ApiProperty() applicationId: string;
  @ApiProperty() redirect_uri: string;
  @ApiProperty() scope: string;
  @ApiProperty() state: string;
  @ApiProperty() code_challenge?: string;
  @ApiProperty() code_challenge_method?: string;
}
