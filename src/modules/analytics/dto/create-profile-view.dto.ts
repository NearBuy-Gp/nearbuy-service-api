import { IsMongoId } from 'class-validator';

export class CreateProfileViewDto {
  @IsMongoId()
  businessId: string;
}