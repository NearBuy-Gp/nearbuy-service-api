import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { Business, BusinessSchema } from 'src/modules/business/schemas/buisness.schema';
import { FileParsingStrategyFactory } from './factories/file-parsing-strategy.factory';
import { PdfParsingStrategy } from './strategies/pdf.strategy';
import { CsvParsingStrategy } from './strategies/csv.strategy';
import { ExcelParsingStrategy } from './strategies/excel.strategy';
import { ImageParsingStrategy2 } from './strategies/image.strategy';
import { TextParsingStrategy } from './strategies/text.strategy';
import { NormalizerModule } from './normalizer/normalizer.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Business.name, schema: BusinessSchema }]), NormalizerModule],
  controllers: [UploadController],
  providers: [UploadService, FileParsingStrategyFactory, PdfParsingStrategy, CsvParsingStrategy, ExcelParsingStrategy, ImageParsingStrategy2, TextParsingStrategy],
})
export class UploadModule {}
