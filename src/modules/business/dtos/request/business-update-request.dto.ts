import { PartialType } from '@nestjs/swagger';
import { BusinessDto } from './business.dto';

export class UpdateBusinessDto extends PartialType(BusinessDto) {}
