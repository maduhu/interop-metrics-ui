set -e

echo Building frontend assets...
cd frontend
npm run build
cd ..

echo Building docker images...
docker-compose build

echo Exporting images to metrics_server_bundle.tar.gz
docker save metricdata_web_1 metricdata_web_2 metricdata_web_3 metricdata_web_4 metricdata_load_balancer | gzip -c > metrics_server_bundle.tar.gz

echo Build complete
