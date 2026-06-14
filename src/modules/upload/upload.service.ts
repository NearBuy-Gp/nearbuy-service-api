import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FileParsingStrategyFactory } from './factories/file-parsing-strategy.factory';
import { FileProcessingResult, BatchProcessingResponse } from './interfaces/batch-processing.interface';
import { NormalizeOutputDto } from './normalizer/dtos/normalizer-output.dto';
import { NormalizerService } from './normalizer/normalizer.service';
import { BusinessCategory } from '../business/enums/business-category.enum';
import { BusinessType } from '../business/enums/business-type.enum';
import { Business } from '../business/schemas/buisness.schema';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    private readonly strategyFactory: FileParsingStrategyFactory,
    private readonly normalizerService: NormalizerService,
    @InjectModel(Business.name) private businessModel: Model<Business>,
  ) {}

  async extractRaw(businessId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');

    const extension = this.strategyFactory.detectFileType(file);
    const strategy = this.strategyFactory.getStrategy(extension);
    const raw = await strategy.parse(file);

    return {
      businessId,
      fileType: extension,
      raw,
    };
  }

  //  Test mode method (no database required)
  async extractRawBatchTest(files: Express.Multer.File[], businessCategory?: BusinessCategory, businessType?: BusinessType): Promise<NormalizeOutputDto[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }

    if (!businessCategory || !businessType) {
      throw new BadRequestException('businessCategory and businessType are required in test mode. ' + 'Example: ?testMode=true&businessCategory=restaurant&businessType=fast_food');
    }

    this.logger.log(`TEST MODE: Processing ${files.length} files for ${businessCategory}/${businessType}`);

    // Process  files in parallel
    const results = await Promise.allSettled(files.map((file) => this.processSingleFile(file)));

    const fileResults: FileProcessingResult[] = [];
    const combinedData: any[] = [];
    let successCount = 0;
    let totalItems = 0;

    results.forEach((result, index) => {
      const fileName = files[index].originalname;

      if (result.status === 'fulfilled') {
        const { fileType, data } = result.value;

        // fileResults.push({
        //   fileName,
        //   fileType,
        //   success: true,
        //   data,
        // });

        combinedData.push(...data);
        successCount++;
        // totalItems += data.length;

        this.logger.log(`${fileName} (${fileType}): ${data.length} items extracted`);
      } else {
        // fileResults.push({
        //   fileName,
        //   fileType: 'unknown',
        //   success: false,
        //   error: result.reason?.message || 'Unknown error',
        // });
        this.logger.error(`${fileName}: ${result.reason?.message || 'Failed to process'}`);
      }
    });

    // // Deduplicate combined data
    // const deduplicatedData = this.deduplicateData(combinedData);

    // // Normalize the data using AI
    // let normalizedItems: NormalizeOutputDto[] = [];

    // try {
    //   normalizedItems = await this.normalizerService.normalize({
    //     rawData: deduplicatedData,
    //     businessCategory,
    //     businessType,
    //     businessId: 'test-business-id', // --> Dummy ID 3shan el test
    //   });

    //   this.logger.log(`TEST MODE: Normalized ${normalizedItems.length} items`);
    // } catch (error) {
    //   this.logger.error(`Normalization failed: ${error.message}`);
    // }

    // return {
    //   businessId: 'test-business-id',
    //   totalFiles: files.length,
    //   successfulFiles: successCount,
    //   failedFiles: files.length - successCount,
    //   fileResults,
    //   combinedData: deduplicatedData,
    //   normalizedItems,
    // };
    // Deduplicate
    const deduplicatedData = this.deduplicateData(combinedData);
    // Normalize
    const normalizedItems = await this.normalizerService.normalize({
      rawData: deduplicatedData,
      businessCategory,
      businessType,
      businessId: 'test-business-id',
    });
    this.logger.log(`TEST MODE: Successfully normalized ${normalizedItems.length} items from ${successCount}/${files.length} files`);

    return normalizedItems;
  }

  // Original method with real business ID
  async extractRawBatch(businessId: string, files: Express.Multer.File[]): Promise<NormalizeOutputDto[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }

    // Validate businessId format
    if (!Types.ObjectId.isValid(businessId)) {
      throw new BadRequestException(`Invalid business ID format: "${businessId}". Must be a 24 character hex string.`);
    }

    // Fetch business details
    // find by id should be implemented fe elbusiness module
    const business = await this.businessModel.findById(businessId);
    if (!business) {
      throw new BadRequestException(`Business with ID ${businessId} not found`);
    }

    // Validate business has category and type
    if (!business.category || !business.type) {
      throw new BadRequestException('Business must have category and type defined for normalization');
    }

    this.logger.log(`Processing ${files.length} files for business ${businessId} (${business.category}/${business.type})`);

    // Process all files in parallel
    const results = await Promise.allSettled(files.map((file) => this.processSingleFile(file)));

    // Collect results

    const combinedData: any[] = [];
    let successCount = 0;

    results.forEach((result, index) => {
      const fileName = files[index].originalname;

      if (result.status === 'fulfilled') {
        const { fileType, data } = result.value;

        // fileResults.push({
        //   fileName,
        //   fileType,
        //   success: true,
        //   data,
        // });

        combinedData.push(...data);
        successCount++;
        // totalItems += data.length;

        this.logger.log(`${fileName} (${fileType}): ${data.length} items extracted`);
      } else {
        // fileResults.push({
        //   fileName,
        //   fileType: 'unknown',
        //   success: false,
        //   error: result.reason?.message || 'Unknown error',
        // });

        this.logger.error(`${fileName}: ${result.reason?.message || 'Failed to process'}`);
      }
    });

    // // Deduplicate combined data
    // const deduplicatedData = this.deduplicateData(combinedData);

    // // Normalize
    // let normalizedItems: NormalizeOutputDto[] = [];

    // try {
    //   normalizedItems = await this.normalizerService.normalize({
    //     rawData: deduplicatedData,
    //     businessCategory: business.category,
    //     businessType: business.type,
    //     businessId: business._id.toString(),
    //   });

    //   this.logger.log(`Normalized ${normalizedItems.length} items`);
    // } catch (error) {
    //   this.logger.error(`Normalization failed: ${error.message}`);
    // }

    // return {
    //   businessId,
    //   totalFiles: files.length,
    //   successfulFiles: successCount,
    //   failedFiles: files.length - successCount,
    //   fileResults,
    //   combinedData: deduplicatedData,
    //   normalizedItems,
    // };
    // Deduplicate
    const deduplicatedData = this.deduplicateData(combinedData);

    // Normalize
    const normalizedItems = await this.normalizerService.normalize({
      rawData: deduplicatedData,
      businessCategory: business.category,
      businessType: business.type,
      businessId: business._id.toString(),
    });

    this.logger.log(`Successfully normalized ${normalizedItems.length} items from ${successCount}/${files.length} files`);

    return normalizedItems;
  }

  private async processSingleFile(file: Express.Multer.File): Promise<{
    fileType: string;
    data: any[];
  }> {
    const extension = this.strategyFactory.detectFileType(file);
    const strategy = this.strategyFactory.getStrategy(extension);
    const data = await strategy.parse(file);

    return {
      fileType: extension,
      data,
    };
  }

  private deduplicateData(items: any[]): any[] {
    const hasTextField = items.length > 0 && 'text' in items[0];

    if (hasTextField) {
      const seen = new Set<string>();
      return items.filter((item) => {
        const text = item.text?.toLowerCase().trim();
        if (!text || seen.has(text)) return false;
        seen.add(text);
        return true;
      });
    }

    return items;
  }
}
