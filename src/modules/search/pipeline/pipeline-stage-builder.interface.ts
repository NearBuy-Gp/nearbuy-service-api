import { PipelineStage } from 'mongoose';
import { SearchRequestDto } from '../dtos/search-request.dto';
import { NlpBluePrint } from '../interfaces/nlp-blue-print.interface';

export interface IPipelineStageBuilder {
  build(blueprint: NlpBluePrint, search: SearchRequestDto): Promise<PipelineStage | null>;
}

export const PIPELINE_STAGE_BUILDERS = 'PIPELINE_STAGE_BUILDERS';
