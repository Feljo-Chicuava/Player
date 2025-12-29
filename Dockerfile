FROM node:18

# Instala dependências essenciais e yt-dlp atualizado
RUN apt update && apt install -y ffmpeg curl \
 && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -o /usr/local/bin/yt-dlp \
 && chmod a+rx /usr/local/bin/yt-dlp

# Define diretório de trabalho
WORKDIR /app
COPY . .

# Instala dependências Node
RUN npm install

# Inicia aplicação
CMD ["npm", "start"]
