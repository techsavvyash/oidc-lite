import { ApiProperty } from '@nestjs/swagger';

class JwtConfiguration {
  @ApiProperty() accessTokenKeyID: string;
  @ApiProperty() refreshTokenTimeToLiveInMinutes: number;
  @ApiProperty() timeToLiveInSeconds: number;
  @ApiProperty() idTokenKeyID: string;
}

export class CreateTenantDto {
  @ApiProperty() name: string;
  @ApiProperty() jwtConfiguration: JwtConfiguration;
  @ApiProperty() data?: string | JSON; // additional data
}

export class UpdateTenantDto {
  @ApiProperty() jwtConfiguration?: JwtConfiguration;
  @ApiProperty() name?: string;
  @ApiProperty() data?: string | JSON;
}
