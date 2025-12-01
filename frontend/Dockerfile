# Etapa de construcción
FROM public.ecr.aws/docker/library/node:18-alpine AS builder

WORKDIR /app

# Copiamos archivos de dependencias
COPY package.json package-lock.json* ./

# Instalamos dependencias
RUN npm install

# Copiamos el código fuente
COPY . .

# Construimos la aplicación para producción
RUN npm run build

# ---

# Etapa de ejecución (Run)
# Usamos una imagen limpia para correr la app
FROM public.ecr.aws/docker/library/node:18-alpine AS runner

WORKDIR /app

# Creamos un usuario no-root por seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiamos los archivos construidos desde la etapa anterior
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Cambiamos al usuario seguro
USER nextjs

# Exponemos el puerto 3000
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Comando de inicio
CMD ["node", "server.js"]
