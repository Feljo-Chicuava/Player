FROM node:18

# Instala dependências e yt-dlp com atualização automática
RUN apt update && apt install -y \
    ffmpeg \
    curl \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Instala yt-dlp via pip para melhor gerenciamento
RUN python3 -m pip install --no-cache-dir --upgrade \
    yt-dlp \
    brotli

# Cria diretório para cookies (opcional, mas útil)
RUN mkdir -p /app/cookies

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

# Garante que yt-dlp está atualizado
RUN yt-dlp -U

EXPOSE 3000

CMD ["npm", "start"]
