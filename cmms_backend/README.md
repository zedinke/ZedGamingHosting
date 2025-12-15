# CMMS Backend API

FastAPI backend for CMMS mobile application.

## Structure

```
cmms_backend/
├── api/
│   ├── __init__.py
│   └── server.py          # FastAPI application
├── config/
│   ├── __init__.py
│   └── app_config.py     # Configuration management
├── database/
│   ├── __init__.py
│   ├── connection.py     # Database connection
│   └── models.py         # SQLAlchemy models
├── scripts/
│   ├── __init__.py
│   └── export_sql_schema.py  # SQL schema export
├── requirements.txt
└── README.md
```

## Installation

1. Copy files to server: `/tmp/cmms-backend`
2. Run install script: `sudo bash install_cmms_backend.sh`
3. Service will start automatically

## Configuration

Copy `.env.example` to `.env` and configure:

- MySQL connection details
- API port (default: 8000)
- Security settings

## API Endpoints

- `GET /` - Root endpoint
- `GET /health` - Simple health check
- `GET /api/health/` - Detailed health check
- `GET /api/v1/info` - API information
- `GET /docs` - Swagger documentation

## Database

The backend uses MySQL database `zedin_cmms` with the following tables:
- users
- tenants
- audit_logs
- tasks

Tables are created automatically on first startup.

