FROM node:20-alpine

WORKDIR /app

# Copia de manifiestos para aprovechar el cacheado de capas
COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]

