import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GeoService } from './geo.service';

// Import BusinessSchema from your business module
// Shown as a placeholder — adjust the import path to match your project
import { BusinessSchema } from '../../business/schemas/buisness.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Business', schema: BusinessSchema }]),
  ],
  providers: [GeoService],
  exports: [GeoService],
})
export class GeoModule {}