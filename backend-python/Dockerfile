FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV HOST=0.0.0.0 PORT=5000 PARKING_DB=/data/parking.db
RUN mkdir -p /data
EXPOSE 5000
CMD ["python", "app.py"]
