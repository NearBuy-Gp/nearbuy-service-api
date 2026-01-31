// interfaces/batch-processing.interface.ts
import { NormalizeOutputDto } from "../../normalizer/dtos/normalizer-output.dto";
export interface FileProcessingResult {
  fileName: string;
  fileType: string;
  success: boolean;
  data?: any[];
  error?: string;
}

export interface BatchProcessingResponse {
  businessId: string;
  totalFiles: number;
  successfulFiles: number;
  failedFiles: number;
  fileResults: FileProcessingResult[];
  combinedData: any[];
  normalizedItems?: NormalizeOutputDto[];
}