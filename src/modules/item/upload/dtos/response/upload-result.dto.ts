import { ApiProperty } from "@nestjs/swagger";
import { Item } from "src/modules/item/schemas/item.schema";

export class UploadResultDto{
    @ApiProperty({
        example: 'File Processed Successfully',
    })
    message: string;

    @ApiProperty({
        example:[
            {
                name: "Chicken Shawarma",
                menuCategory: "Sandwiches",
                sizes: ["small", "large"],
                pricePerSize: { small: 70, large: 90 },
                type: "product",
            },
        ],
        description:'Parsed Items ready to be saved as CreateItemDto'
    })
    paresdItems:any[];

    @ApiProperty({
        example:[
            "Failed to extract price from 'Beef Burger Deluxe'",
            "Unknown category 'Deserts' mapped to 'Desserts'",
        ],
        description: 'warnings or partially parsed lines',
        required: false,
    })
    warnings?: string[];

}