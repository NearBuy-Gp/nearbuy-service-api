export class ParsedItemDto{
    name: string;
    description?: string;
    price?: number;
    category?: string;
    //sku -> stock keeping units
    sku?:string; 
}