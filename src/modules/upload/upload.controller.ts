// upload/upload.controller.ts
import { Controller, Post, Param, UploadedFile, UploadedFiles, UseInterceptors, Body, Query } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor, AnyFilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { BatchProcessingResponse } from './interfaces/batch-processing.interface';
import { BusinessCategory } from '../business/enums/business-category.enum';
import { BusinessType } from '../business/enums/business-type.enum';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller(':businessId/item/upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}
  @Post('raw')
  @ApiOperation({ summary: 'Extract Items from 1 uploaded file' })
  @ApiResponse({
    status: 200,
    description: 'Successfully Extracted Items from the uploded file.',
  })
  // Single file upload (uses 'file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadRaw(@Param('businessId') businessId: string, @UploadedFile() file: Express.Multer.File) {
    return this.uploadService.extractRaw(businessId, file);
  }

  // Multiple files upload (uses 'files')
  @Post('raw/batch')
  @ApiOperation({ summary: 'Extract Items from more than 1 uploaded file' })
  @ApiResponse({
    status: 200,
    description: 'Successfully Extracted Items from uploded files.',
  })
  @UseInterceptors(AnyFilesInterceptor())
  async uploadRawBatch(
    @Param('businessId') businessId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Query('testMode') testMode?: string, //Add test  flag
    @Query('businessCategory') businessCategory?: BusinessCategory, //For test
    @Query('businessType') businessType?: BusinessType, //For test
  ): Promise<BatchProcessingResponse> {
    // If test mode, use query params instead of DB
    if (testMode === 'true') {
      return this.uploadService.extractRawBatchTest(files, businessCategory, businessType);
    }

    // Normal mode with real business ID
    return this.uploadService.extractRawBatch(businessId, files);
  }
}
