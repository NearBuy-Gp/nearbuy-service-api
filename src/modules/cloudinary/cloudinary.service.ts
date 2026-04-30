import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse ,UploadApiErrorResponse} from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  public async uploadImage(file: Express.Multer.File, folder: string = 'items'): Promise<string> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder,
          transformation: [
            { width: 800, height: 800, crop: 'limit' }, // cap max size
            { quality: 'auto' }, // auto compress
            { fetch_format: 'auto' }, // webp for browsers that support it
          ],
        },
        (error: UploadApiErrorResponse | undefined, result?: UploadApiResponse) => {
          if (error || !result) return reject(new BadRequestException('Image upload failed'));
          resolve(result.secure_url);
        },
      );
      Readable.from(file.buffer).pipe(upload);
    });
  }

  async uploadMany(files: Express.Multer.File[], folder?: string): Promise<string[]> {
    return Promise.all(files.map((file) => this.uploadImage(file, folder)));
  }

  async deleteImage(imageUrl: string): Promise<void> {
    // extract public_id from url e.g. "items/abc123"
    const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0];
    await cloudinary.uploader.destroy(publicId);
  }
}
