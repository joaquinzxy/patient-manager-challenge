import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { UnsupportedMediaTypeException } from '@nestjs/common';
import { Request } from 'express';

export const fileUploadConfig: MulterOptions = {
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
    },
    fileFilter: (req: Request, file: Express.Multer.File, callback: any) => {
        const allowedMimeTypes = (process.env.ALLOWED_MIME_TYPES || 
            'image/jpeg,image/png,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ).split(',');

        if (allowedMimeTypes.includes(file.mimetype)) {
            callback(null, true);
        } else {
            callback(new UnsupportedMediaTypeException(
                `File type ${file.mimetype} is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`
            ), false);
        }
    },
};
