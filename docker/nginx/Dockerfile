FROM nginx:latest

COPY nginx.conf /etc/nginx/nginx.conf
COPY frontend/build /opt/modusbox/metrics_server/frontend

EXPOSE 80

# Define default command.
CMD ["nginx", "-g", "daemon off;"]
