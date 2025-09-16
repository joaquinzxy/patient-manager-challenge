# Sistema de Gestión de Pacientes

Sistema de gestión de pacientes desarrollado con NestJS, React y PostgreSQL.

## Por qué NestJS

NestJS fue elegido para este proyecto por su escalabilidad y arquitectura modular que permite el crecimiento orgánico del sistema.

## Por qué Supabase

Supabase fue seleccionado como storage por su free tier de 1GB perfecto para pruebas de concepto y su API simple similar a AWS S3.

## Instalación

### Con Docker

```bash
docker-compose up --build -d
```

### Manual

Backend:
```bash
cd backend
pnpm install
pnpm run start:dev
```

Frontend:
```bash
cd frontend
pnpm install
pnpm run dev
```

## URLs

- Frontend: http://localhost:3001
- Backend API: http://localhost:3000/api/v1
- Swagger: http://localhost:3000/api/v1/docs

## API Endpoints

```
GET    /api/v1/patients      # Listar pacientes
POST   /api/v1/patients      # Crear paciente
GET    /api/v1/patients/:id  # Obtener paciente
PUT    /api/v1/patients/:id  # Actualizar paciente
DELETE /api/v1/patients/:id  # Eliminar paciente
```

## Funcionalidades a Implementar

### Notificaciones SMS
Sistema de notificaciones por SMS para comunicación con pacientes.

### Validación de Número de Teléfono por País
Validación automática de números telefónicos según el código de país del paciente.

### Sistema SQS para Notificaciones
Implementar AWS SQS para manejar las notificaciones de manera más eficiente con colas y reintentos automáticos.

### Testing unitario
Implementar testing en servicios y controladores.

### Authentication & Roles
Sistema de login por JWT para control de acceso y roles para limitar acciones.

### Prometheus & Grafana
Para medir métricas del contenedor y consumos de la API.
