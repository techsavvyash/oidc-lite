import { ApiProperty } from '@nestjs/swagger';

class OauthConfiguration {
  @ApiProperty() authorizedOriginURLs: string[];
  @ApiProperty() authorizedRedirectURLs: string[];
  @ApiProperty() clientSecret: string;
  @ApiProperty() enabledGrants: string[];
  @ApiProperty() logoutURL: string;
}

class JwtConfiguration {
  @ApiProperty() accessTokenKeyID?: string;
  @ApiProperty() refreshTokenTimeToLiveInMinutes: number;
  @ApiProperty() timeToLiveInSeconds: number;
  @ApiProperty() idTokenKeyID?: string;
}

export class RoleDto {
  @ApiProperty() description: string;
  @ApiProperty() isDefault: boolean;
  @ApiProperty() isSuperRole: boolean;
  @ApiProperty() name: string;
  @ApiProperty() id?: string;
}

export class ScopeDto {
  @ApiProperty() defaultConsentDetail: string;
  @ApiProperty() defaultConsentMessage: string;
  @ApiProperty() id?: string;
  @ApiProperty() name: string;
  @ApiProperty() required: boolean;
}

export class CreateApplicationDto {
  @ApiProperty() active: boolean;
  @ApiProperty() name: string;
  @ApiProperty() scopes: ScopeDto[];
  @ApiProperty() roles: RoleDto[];
  @ApiProperty() tenant_id: string;
  @ApiProperty() jwtConfiguration: JwtConfiguration;
  @ApiProperty() oauthConfiguration: OauthConfiguration;
}

export class UpdateApplicationDto {
  @ApiProperty() active?: boolean;
  @ApiProperty() tenant_id?: string;
  @ApiProperty() jwtConfiguration?: JwtConfiguration;
  @ApiProperty() oauthConfiguration?: OauthConfiguration;
  @ApiProperty() name?: string;
}
