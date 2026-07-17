# Imagen base Node.js oficial (versión LTS liviana)
FROM node:20-alpine

# Directorio de trabajo en el contenedor
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production

# Copiar el resto del código del proyecto
COPY . .

# Exponer el puerto configurado (3113)
EXPOSE 3113

# Comando para ejecutar la aplicación
CMD ["node", "server.js"]
