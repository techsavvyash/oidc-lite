import { ApiProperty } from '@nestjs/swagger';

class Endpoints {
  @ApiProperty() url: string;
  @ApiProperty() methods: string;
}

export class Permissions {
  @ApiProperty() endpoints: Endpoints[];
}

export class CreateApiKeyDto {
  @ApiProperty() key?: string;
  @ApiProperty() permissions?: Permissions;
  @ApiProperty() metaData?: string | JSON;
  @ApiProperty() tenantId?: string;
}
class UpdataPermissionsDto {
  @ApiProperty() endpoints?: Endpoints[];
}
export class UpdateApiKeyDto {
  @ApiProperty() key?: string;
  @ApiProperty() permissions?: UpdataPermissionsDto;
  @ApiProperty() metaData?: string | JSON;
}

class ApiKey {
  @ApiProperty() id: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiProperty() keyManager: boolean;
  @ApiProperty() permissions: Permissions;
  @ApiProperty() metaData: string;
  @ApiProperty() tenantsId: string;
}
export class ApiKeyResponseDto {
  @ApiProperty() message: string;
  @ApiProperty() apiKey?: ApiKey;
}
