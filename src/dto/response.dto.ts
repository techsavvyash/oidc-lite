import { ApiProperty } from '@nestjs/swagger';

export class ResponseDto {
  @ApiProperty() success: boolean;
  @ApiProperty() message: string;
  @ApiProperty() data: Record<string, any>;
}
