import { ApiProperty } from '@nestjs/swagger';

export class updateDTO {
  @ApiProperty() name: string;
}

export class generateKeyDTO {
  @ApiProperty() algorithm: string;
  @ApiProperty() issuer: string;
  @ApiProperty() name: string;
  @ApiProperty() length: number;
}

export class KeyDto {
  @ApiProperty() id: string;
  @ApiProperty() algorithm: string;
  @ApiProperty() certificate: string;
  @ApiProperty() expiry: number;
  @ApiProperty() createdAt: Date;
  @ApiProperty() issuer: string;
  @ApiProperty() kid: string;
  @ApiProperty() updatedAt: Date;
  @ApiProperty() name: string;
  @ApiProperty() privateKey: string;
  @ApiProperty() publicKey: string;
  @ApiProperty() secret: string;
  @ApiProperty() type: string;
  @ApiProperty() data: string;
}
