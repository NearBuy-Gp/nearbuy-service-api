import { Body, Controller, Delete, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ImageValidationPipe } from '../item/pipes/image-validation.pipe';

@Controller('upload/images')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}
  @Post('/business')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
    }),
  )
  async uploadImagesBusiness(@UploadedFile(ImageValidationPipe) file: Express.Multer.File) {
    console.log(file.buffer);

    const imageUrl = await this.cloudinaryService.uploadImage(file, 'business');
    return {
      message: 'Image uploaded successfully',
      url: imageUrl,
    };
  }
  @Post('/items')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
    }),
  )
  async uploadImagesItems(@UploadedFile(ImageValidationPipe) file: Express.Multer.File) {
    const imageUrl = await this.cloudinaryService.uploadImage(file, 'items');
    return {
      message: 'Image uploaded successfully',
      url: imageUrl,
    };
  }
  @Delete('')
  async deleteImage(@Body('imageUrl') imageUrl: string) {
    await this.cloudinaryService.deleteImage(imageUrl);
  }
}
