import { ApiProperty } from '@nestjs/swagger';

enum METHODS {
  DELETE = 'DELETE',
  POST = 'POST',
  GET = 'GET',
  PATCH = 'PATCH',
  PUT = 'PUT',
}

class Endpoints {
  @ApiProperty() url: string;
  @ApiProperty() methods: METHODS[];
}

class Permissions {
  @ApiProperty() endpoints: Endpoints[];
  @ApiProperty() tenantId?: string;
}

export class CreateApiKeyDto {
  @ApiProperty() key?: string;
  @ApiProperty() permissions?: Permissions;
  @ApiProperty() metaData?: string | JSON;
}
class UpdataPermissionsDto{
  @ApiProperty() endpoints?: Endpoints[];
}
export class UpdateApiKeyDto {
  @ApiProperty() key?: string;
  @ApiProperty() permissions?: UpdataPermissionsDto;
  @ApiProperty() metaData?: string | JSON;
}
