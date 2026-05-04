// upload/upload.controller.ts
import { Controller, Post, Param, UploadedFile, UploadedFiles, UseInterceptors, Body, Query } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor, AnyFilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { BusinessCategory } from '../business/enums/business-category.enum';
import { BusinessType } from '../business/enums/business-type.enum';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NormalizeOutputDto } from './normalizer/dtos/normalizer-output.dto';  

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
    type: [NormalizeOutputDto], 
  })
  @UseInterceptors(AnyFilesInterceptor())
  async uploadRawBatch(
    @Param('businessId') businessId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Query('testMode') testMode?: string, //Add test  flag
    @Query('businessCategory') businessCategory?: BusinessCategory, //For test
    @Query('businessType') businessType?: BusinessType, //For test
  ):Promise<NormalizeOutputDto[]> {  
    if (testMode === 'true') {
      return this.uploadService.extractRawBatchTest(files, businessCategory, businessType);
    }
    return this.uploadService.extractRawBatch(businessId, files);
  }
}
