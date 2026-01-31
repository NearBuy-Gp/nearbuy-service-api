import { NormalizeInputDto } from "./dtos/normalizer-input.dto";
import { NormalizeOutputDto } from "./dtos/normalizer-output.dto";

export interface NormalizerStrategy {
  
  normalize(input: NormalizeInputDto): Promise<NormalizeOutputDto[]>;
}