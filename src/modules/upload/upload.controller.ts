// upload/upload.controller.ts
import {
  Controller,
  Post,
  Param,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  Body,
  Query,
} from '@nestjs/common';
import {
  FileInterceptor,
  FilesInterceptor,
  AnyFilesInterceptor,
} from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { BatchProcessingResponse } from './interfaces/batch-processing.interface';
import { BusinessCategory } from '../business/enums/business-category.enum';
import { BusinessType } from '../business/enums/business-type.enum';

@Controller(':businessId/item/upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // Single file upload (uses 'file')
  @Post('raw')
  @UseInterceptors(FileInterceptor('file'))
  async uploadRaw(
    @Param('businessId') businessId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.uploadService.extractRaw(businessId, file);
  }

  // Multiple files upload (uses 'files')
  @Post('raw/batch')
  @UseInterceptors(FilesInterceptor('files', 20))
  async uploadRawBatch(
    @Param('businessId') businessId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Query('testMode') testMode?: string, // ✅ Add test mode flag
    @Query('businessCategory') businessCategory?: BusinessCategory, // ✅ For test mode
    @Query('businessType') businessType?: BusinessType, // ✅ For test mode
  ): Promise<BatchProcessingResponse> {
    // If test mode, use query params instead of DB
    if (testMode === 'true') {
      return this.uploadService.extractRawBatchTest(
        files,
        businessCategory,
        businessType,
      );
    }

    // Normal mode with real business ID
    return this.uploadService.extractRawBatch(businessId, files);
  }
}
