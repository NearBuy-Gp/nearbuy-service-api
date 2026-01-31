import { ApiProperty } from "@nestjs/swagger";
import { IsEnum,IsNotEmpty,IsOptional,IsString } from "class-validator";
import { BusinessCategory } from "src/modules/business/enums/business-category.enum";
export class UploadFileDto{
    @ApiProperty({
        type: 'string',
        format: 'binary',
        description: 'File to upload (image, pdf, csv, xlsx, txt)',
    })
    file: any;

    @ApiProperty({
        enum: BusinessCategory,
        example: BusinessCategory.RESTAURANT,
        description: 'Category pf business for correct parsing',
    })
    @IsEnum(BusinessCategory)
    businessType:BusinessCategory;

    @ApiProperty({
        example: 'resturant menu of butgers , pizza....',
        description: 'Optional description to help parser understand the context',
        required: false,
    })
    @IsOptional()
    @IsString()
    contextHint: string;
}