import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SearchRequestDto {
  @ApiProperty({ example: 'Pizza place near me' })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiProperty({ example: 'User Location [latitude, longitude]' })
  @IsNotEmpty()
  userLocation: [number, number]; // [latitude, longitude]
}
