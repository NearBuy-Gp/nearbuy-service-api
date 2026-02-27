import { Body, Controller, Delete, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ImageValidationPipe } from '../item/pipes/image-validation.pipe';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Cloudinary')
@Controller('upload/images')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}
  @ApiOperation({ summary: 'Upload Image business' })
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: `{
        url: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
        message:'Image uploaded successfully',
    }`,
  })
  @Post('/business')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
    }),
  )
  async uploadImagesBusiness(@UploadedFile(ImageValidationPipe) file: Express.Multer.File) {
    const imageUrl = await this.cloudinaryService.uploadImage(file, 'business');
    return {
      message: 'Image uploaded successfully',
      url: imageUrl,
    };
  }
  @ApiOperation({ summary: 'Upload Image items' })
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: `{
        url: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
        message:'Image uploaded successfully',
    }`,
  })
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
