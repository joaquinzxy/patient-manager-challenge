import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { FilesService } from './files.service';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get('download/:filename')
  @ApiOperation({ summary: 'Download a file by filename' })
  @ApiParam({ name: 'filename', description: 'File name to download' })
  @ApiResponse({ status: 200, description: 'File downloaded successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async downloadFile(
    @Param('filename') filename: string,
    @Res() res: Response
  ): Promise<void> {
    try {
      const { file, mimeType, originalName } = await this.filesService.downloadFile(filename);
      
      res.set({
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${originalName}"`,
      });
      
      res.send(file);
    } catch (error) {
      throw new NotFoundException('File not found');
    }
  }
}
