import { PartialType } from '@nestjs/swagger';
import { BusinessRegistrationDto } from './business-registration.dto';

export class UpdateBusinessDto extends PartialType(BusinessRegistrationDto) {}
