import { ApiProperty } from '@nestjs/swagger';

export class AutocompleteSuggestionDto {
  @ApiProperty({ example: 'Pizza Margherita' })
  name: string;

  @ApiProperty({ example: 'Mario\'s Pizzeria' })
  businessName: string;
}

export class AutocompleteResponseDto {
  @ApiProperty({ type: [AutocompleteSuggestionDto] })
  suggestions: AutocompleteSuggestionDto[];
}
