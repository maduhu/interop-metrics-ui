FROM python:3

ENV PROJECT_PATH /opt/modusbox/metrics_server
ENV PYTHONPATH $PROJECT_PATH
WORKDIR $PROJECT_PATH

COPY docker_requirements.txt .
RUN pip install --no-cache-dir -r docker_requirements.txt

COPY metrics_server ./metrics_server

EXPOSE 8080

CMD ["python", "metrics_server/run.py"]
