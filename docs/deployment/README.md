# Deployment Guide

This document outlines the deployment process for the Elo Insight application.

## Local Development Deployment

### Prerequisites

- Docker and Docker Compose installed
- Git repository cloned

### Steps

1. Navigate to the project root directory
2. Create necessary environment files (see Development Setup guide)
3. Run the application using Docker Compose:

```bash
docker-compose up --build
```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080

## Production Deployment

### Prerequisites

- Docker installed on the production server
- Domain name configured
- SSL certificate obtained

### Environment Configuration

Create production environment files with appropriate values:

**Backend (.env)**
```
PORT=8080
GIN_MODE=release
DB_HOST=postgres
DB_PORT=5432
DB_USER=production_user
DB_PASSWORD=secure_password
DB_NAME=elo_insight_prod
JWT_SECRET=secure_jwt_secret
STEAM_API_KEY=your_steam_api_key
RIOT_API_KEY=your_riot_api_key
```

**Frontend (.env)**
```
REACT_APP_API_URL=https://api.yourdomain.com
```

### Docker Compose for Production

Create a `docker-compose.prod.yml` file:

```yaml
version: '3'

services:
  frontend:
    build:
      context: ./frontend
      args:
        - REACT_APP_API_URL=https://api.yourdomain.com
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
    restart: always

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    env_file:
      - ./backend/.env
    depends_on:
      - postgres
    restart: always

  postgres:
    image: postgres:13
    ports:
      - "5432:5432"
    env_file:
      - ./postgres/.env
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

volumes:
  postgres_data:
```

### Deployment Steps

1. SSH into your production server
2. Clone the repository
3. Configure environment files
4. Build and start the containers:

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

5. Verify the deployment:
   - Check container status: `docker ps`
   - Check logs: `docker-compose -f docker-compose.prod.yml logs -f`

## CI/CD Pipeline

For automated deployments, set up a CI/CD pipeline using GitHub Actions:

1. Create a `.github/workflows/deploy.yml` file:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup SSH
        uses: webfactory/ssh-agent@v0.5.3
        with:
          ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}
          
      - name: Deploy to production
        run: |
          ssh ${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }} "cd ${{ secrets.PROJECT_PATH }} && git pull && docker-compose -f docker-compose.prod.yml up -d --build"
```

2. Configure GitHub repository secrets:
   - `SSH_PRIVATE_KEY`: SSH private key for server access
   - `SSH_USER`: Username for SSH connection
   - `SSH_HOST`: Server hostname or IP address
   - `PROJECT_PATH`: Path to the project on the server

## Backup Strategy

### Database Backups

1. Create a backup script:

```bash
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/path/to/backups"
CONTAINER_NAME="elo-insight_postgres_1"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Backup database
docker exec $CONTAINER_NAME pg_dump -U postgres elo_insight > $BACKUP_DIR/elo_insight_$TIMESTAMP.sql

# Compress backup
gzip $BACKUP_DIR/elo_insight_$TIMESTAMP.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "elo_insight_*.sql.gz" -type f -mtime +30 -delete
```

2. Schedule the script to run daily using cron:

```
0 2 * * * /path/to/backup_script.sh
```

## Monitoring

Set up monitoring using Prometheus and Grafana:

1. Add monitoring services to `docker-compose.prod.yml`:

```yaml
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus:/etc/prometheus
      - prometheus_data:/prometheus
    restart: always

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana
    depends_on:
      - prometheus
    restart: always

volumes:
  prometheus_data:
  grafana_data:
```

2. Configure Prometheus to scrape metrics from the backend service

## SSL Configuration

For HTTPS support, configure SSL in the Nginx configuration:

1. Obtain SSL certificates (e.g., using Let's Encrypt)
2. Update Nginx configuration to use SSL certificates
3. Redirect HTTP traffic to HTTPS

## Troubleshooting

### Common Issues

1. **Database connection errors**:
   - Check database credentials
   - Verify network connectivity between containers

2. **API not accessible**:
   - Check if backend container is running
   - Verify API port is exposed correctly

3. **Frontend not loading**:
   - Check if frontend container is running
   - Verify Nginx configuration

### Viewing Logs

```bash
# View all container logs
docker-compose -f docker-compose.prod.yml logs

# View specific container logs
docker-compose -f docker-compose.prod.yml logs backend

# Follow logs in real-time
docker-compose -f docker-compose.prod.yml logs -f
```
