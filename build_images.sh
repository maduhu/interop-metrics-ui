set -e

echo Building frontend assets...
cd frontend
npm run build
cd ..
echo Building docker images...
docker-compose build
echo Build complete
