import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { PatientService } from './patient.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { Patient } from './entities/patient.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/pagination.interface';
import { fileUploadConfig } from '../config/file-upload.config';

@ApiTags('patients')
@Controller('patients')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image', fileUploadConfig))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new patient with optional profile photo' })
  @ApiResponse({ 
    status: 201, 
    description: 'Patient successfully created',
    type: Patient 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid input data' 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Patient with this email already exists' 
  })
  async create(
    @Body() createPatientDto: CreatePatientDto,
    @UploadedFile() image?: Express.Multer.File
  ): Promise<Patient> {
    return await this.patientService.create(createPatientDto, image);
  }

  @Get()
  @ApiOperation({ summary: 'Get all patients with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Field to sort by' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: 'Sort order' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term' })
  @ApiResponse({ 
    status: 200, 
    description: 'Paginated list of active patients' 
  })
  async findAll(@Query() paginationDto?: PaginationDto): Promise<PaginatedResult<Patient>> {
    return await this.patientService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a patient by ID' })
  @ApiParam({ name: 'id', description: 'Patient UUID', type: 'string' })
  @ApiResponse({ 
    status: 200, 
    description: 'Patient found',
    type: Patient 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Patient not found' 
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Patient> {
    return await this.patientService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a patient' })
  @ApiParam({ name: 'id', description: 'Patient UUID', type: 'string' })
  @ApiResponse({ 
    status: 200, 
    description: 'Patient successfully updated',
    type: Patient 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid input data' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Patient not found' 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Patient with this email already exists' 
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updatePatientDto: UpdatePatientDto
  ): Promise<Patient> {
    return await this.patientService.update(id, updatePatientDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a patient (logical deletion)' })
  @ApiParam({ name: 'id', description: 'Patient UUID', type: 'string' })
  @ApiResponse({ 
    status: 200, 
    description: 'Patient successfully deleted' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Patient not found' 
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    return await this.patientService.remove(id);
  }

  @Get('deleted')
  @ApiOperation({ summary: 'Get all deleted patients' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of all deleted patients',
    type: [Patient] 
  })
  async findDeleted(): Promise<Patient[]> {
    return await this.patientService.findDeleted();
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all patients including deleted ones' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of all patients (active and deleted)',
    type: [Patient] 
  })
  async findAllIncludingDeleted(): Promise<Patient[]> {
    return await this.patientService.findAllIncludingDeleted();
  }
}
