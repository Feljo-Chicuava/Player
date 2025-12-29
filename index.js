import express from "express";
import { exec } from "child_process";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Rota principal
app.get("/", (req, res) => {
  res.json({ 
    status: "API yt-dlp online",
    endpoints: [
      { method: "GET", path: "/download", query: "url, type(mp3|video)" },
      { method: "GET", path: "/info", query: "url" }
    ]
  });
});

// Rota para obter informações do vídeo
app.get("/info", (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "URL obrigatória" });
  }

  const cmd = `yt-dlp --dump-json --no-warnings "${url}"`;

  exec(cmd, { timeout: 30000 }, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({
        error: "Falha ao obter informações",
        details: stderr || err.message
      });
    }

    try {
      const info = JSON.parse(stdout);
      res.json({
        success: true,
        title: info.title,
        duration: info.duration,
        formats: info.formats?.length || 0,
        thumbnail: info.thumbnail
      });
    } catch (parseErr) {
      res.status(500).json({
        error: "Erro ao processar informações",
        details: parseErr.message
      });
    }
  });
});

// Rota de download com mais opções
app.get("/download", (req, res) => {
  const { url, type, quality } = req.query;

  if (!url) {
    return res.status(400).json({ error: "URL obrigatória" });
  }

  let cmd = "";

  if (type === "mp3") {
    // Para áudio MP3
    cmd = `yt-dlp -x --audio-format mp3 --audio-quality 0 --no-warnings "${url}" -o -`;
  } else if (type === "audio") {
    // Para áudio no formato original
    cmd = `yt-dlp -f "ba" --no-warnings "${url}" -o -`;
  } else {
    // Para vídeo
    const qualityFilter = quality === "low" ? "18" : quality === "medium" ? "22" : "best";
    cmd = `yt-dlp -f "${qualityFilter}" --no-warnings "${url}" -o -`;
  }

  console.log(`Executando: ${cmd.substring(0, 100)}...`);

  // Executa com timeout maior
  const child = exec(cmd, { timeout: 120000 }, (err, stdout, stderr) => {
    if (err) {
      console.error("Erro no yt-dlp:", stderr);
      
      // Tenta com fallback
      const fallbackCmd = `yt-dlp -f "best" --no-warnings "${url}" -g`;
      exec(fallbackCmd, { timeout: 30000 }, (fallbackErr, fallbackStdout) => {
        if (fallbackErr) {
          return res.status(500).json({
            error: "yt-dlp falhou",
            details: "Não foi possível processar o vídeo. Tente atualizar o yt-dlp com: yt-dlp -U",
            stderr: stderr.substring(0, 200) // Limita o tamanho do log
          });
        }
        
        const downloadUrl = fallbackStdout.trim();
        if (downloadUrl) {
          res.json({
            success: true,
            download_url: downloadUrl,
            note: "Usando formato fallback"
          });
        }
      });
      return;
    }

    if (!stdout.trim()) {
      return res.status(500).json({
        error: "Nenhum conteúdo retornado",
        details: "O vídeo pode estar indisponível ou restrito"
      });
    }

    // Se for stream direto (com -g)
    if (cmd.includes("-g")) {
      res.json({
        success: true,
        download_url: stdout.trim()
      });
    }
  });

  // Para streams diretos, pipe o conteúdo
  if (!cmd.includes("-g")) {
    child.stdout.pipe(res);
    
    // Configura headers apropriados
    if (type === "mp3" || type === "audio") {
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', 'attachment; filename="audio.mp3"');
    } else {
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"');
    }
  }
});

// Rota para atualizar yt-dlp
app.get("/update", (req, res) => {
  exec("yt-dlp -U", { timeout: 60000 }, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({
        error: "Falha na atualização",
        details: stderr || err.message
      });
    }
    res.json({
      success: true,
      message: "yt-dlp atualizado",
      output: stdout
    });
  });
});

app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
  console.log(`yt-dlp versão:`);
  exec("yt-dlp --version", (err, stdout) => {
    if (!err) console.log(stdout.trim());
  });
});
