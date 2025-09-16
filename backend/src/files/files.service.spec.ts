import { Test, TestingModule } from '@nestjs/testing';
import { FilesService } from './files.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { File } from './entities/file.entity';
import { PatientFile } from './entities/patient-file.entity';
import { Repository } from 'typeorm';

describe('FilesService', () => {
    let service: FilesService;
    let fileRepository: Repository<File>;
    let patientFileRepository: Repository<PatientFile>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FilesService,
                {
                    provide: getRepositoryToken(File),
                    useValue: {
                        create: jest.fn(),
                        save: jest.fn(),
                        findOne: jest.fn(),
                        delete: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(PatientFile),
                    useValue: {
                        create: jest.fn(),
                        save: jest.fn(),
                        findOne: jest.fn(),
                        update: jest.fn(),
                        delete: jest.fn(),
                        count: jest.fn(),
                        createQueryBuilder: jest.fn().mockReturnValue({
                            leftJoinAndSelect: jest.fn().mockReturnThis(),
                            where: jest.fn().mockReturnThis(),
                            andWhere: jest.fn().mockReturnThis(),
                            orderBy: jest.fn().mockReturnThis(),
                            getMany: jest.fn(),
                        }),
                    },
                },
            ],
        }).compile();

        service = module.get<FilesService>(FilesService);
        fileRepository = module.get<Repository<File>>(getRepositoryToken(File));
        patientFileRepository = module.get<Repository<PatientFile>>(getRepositoryToken(PatientFile));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
