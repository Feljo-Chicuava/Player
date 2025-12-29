import express from "express";
import { exec } from "child_process";

const app = express();
const PORT = process.env.PORT || 3000;

// Rota principal
app.get("/", (req, res) => {
  res.json({ status: "API yt-dlp online" });
});

// Rota de download
app.get("/download", (req, res) => {
  const { url, type } = req.query;

  if (!url) {
    return res.status(400).json({ error: "URL obrigatória" });
  }

  // Define o comando yt-dlp
  const cmd =
    type === "mp3"
      ? `yt-dlp -x --audio-format mp3 -g "${url}"`
      : `yt-dlp -f "bv*+ba/b" -g "${url}"`;

  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({
        error: "yt-dlp falhou",
        details: stderr || err.message
      });
    }

    if (!stdout.trim()) {
      return res.status(500).json({
        error: "Nenhum link retornado",
        details: stderr
      });
    }

    // Se der certo
    res.json({
      success: true,
      download_url: stdout.trim()
    });
  });
});

app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});
