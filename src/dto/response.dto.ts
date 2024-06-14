import { ApiProperty } from '@nestjs/swagger';

export class ResponseDto {
  @ApiProperty() success: boolean;
  @ApiProperty() message: string;
  @ApiProperty() data?: Record<string, any>;
}

export class ResponseTenantDto {
  @ApiProperty() success: boolean;
  @ApiProperty() message: string;
  @ApiProperty() data: TenantDto;
}
export class TenantDto {
  @ApiProperty() id: string;
  @ApiProperty() accessTokenSigningKeysId: string;
  @ApiProperty() data: string;
  @ApiProperty() idTokenSigningKeysId: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiProperty() name: string;
}
