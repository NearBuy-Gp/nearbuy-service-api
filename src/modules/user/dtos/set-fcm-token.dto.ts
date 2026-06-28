import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SetFcmTokenDto {
  @ApiProperty({
    description: 'The FCM device token obtained from the Firebase SDK on the client',
    example: 'fXyz...:APA91b...',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
