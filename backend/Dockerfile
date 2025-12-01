# Usamos una imagen ligera de Python
FROM public.ecr.aws/docker/library/python:3.11-slim

# Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /app

# Instalamos dependencias del sistema necesarias (gcc a veces hace falta para algunas libs)
RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*

# Copiamos primero los requerimientos para aprovechar la caché de Docker
COPY requirements.txt .

# Force cache invalidation for requirements
ENV REFRESHED_AT=2025-11-30_v5
ENV PIP_DEFAULT_TIMEOUT=100

# Verificamos el contenido de requirements.txt y actualizamos pip
RUN cat requirements.txt && pip install --upgrade pip

# Instalamos las dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# Debug: Listar paquetes instalados para verificar langchain
RUN pip list

# Copiamos el resto del código
COPY . .

# Exponemos el puerto 8000
EXPOSE 8000

# Comando para iniciar la aplicación
# IMPORTANTE: --host 0.0.0.0 es necesario para que sea accesible desde fuera del contenedor
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
