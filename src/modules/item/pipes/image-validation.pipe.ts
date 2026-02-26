import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ImageValidationPipe implements PipeTransform {
  private readonly allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  private readonly maxSize = 5 * 1024 * 1024;

  transform(files: Express.Multer.File | Express.Multer.File[]) {
    const fileArray = Array.isArray(files) ? files : [files];

    for (const file of fileArray) {
      if (!this.allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException('Only JPEG, PNG, WebP, and JPG images are allowed');
      }
      if (file.size > this.maxSize) {
        throw new BadRequestException('Image must be smaller than 5MB');
      }
    }

    return files;
  }
}
