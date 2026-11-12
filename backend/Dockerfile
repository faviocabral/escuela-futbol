FROM node:20-slim


WORKDIR /app

COPY package*.json ./
RUN npm config set strict-ssl false
RUN npm install

COPY . .

# Exponer el puerto para que sea accesible desde fuera del contenedor
EXPOSE 3800

CMD ["node", "index.js"]
