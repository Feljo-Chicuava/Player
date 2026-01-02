// index.js - Na raiz, não na pasta api!
const TARGET_BASE = "https://player.fimoo.site";
const FAKE_ORIGIN = "https://hyper.hyperappz.site/";
const FAKE_REFERER = "https://hyper.hyperappz.site/";

module.exports = async (req, res) => {
  try {
    // ================= PEGAR PATH DA URL =================
    const path = req.url.replace(/^\//, '');
    
    // Se for acesso à raiz sem nada
    if (!path) {
      res.setHeader('Content-Type', 'text/html');
      return res.end(`
        <html>
          <head><title>Player Proxy</title></head>
          <body>
            <h1>Player Proxy</h1>
            <p>Use: https://${req.headers.host}/12345</p>
            <p>Exemplo: https://${req.headers.host}/70145</p>
          </body>
        </html>
      `);
    }
    
    // ================= DETERMINAR URL ALVO =================
    let targetPath;
    if (/^\d+$/.test(path)) {
      // É um ID de vídeo (apenas números)
      targetPath = `/embed/${path}`;
    } else {
      // É um asset (css, js, images, etc.)
      targetPath = `/${path}`;
    }
    
    const targetUrl = `${TARGET_BASE}${targetPath}`;
    
    // ================= FAZER REQUEST =================
    const response = await fetch(targetUrl, {
      headers: {
        "Origin": FAKE_ORIGIN,
        "Referer": FAKE_REFERER,
        "User-Agent": req.headers['user-agent'] || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": req.headers['accept'] || "*/*",
        "Accept-Language": req.headers['accept-language'] || "pt-BR,pt;q=0.9,en;q=0.8"
      },
      redirect: 'follow'
    });
    
    // ================= PROCESSAR RESPOSTA =================
    const contentType = response.headers.get('content-type') || '';
    const isHtml = contentType.includes('text/html');
    const isCss = contentType.includes('text/css');
    const isJs = contentType.includes('javascript');
    
    // ================= COPIAR HEADERS =================
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (contentType) res.setHeader('Content-Type', contentType);
    if (response.headers.get('cache-control')) {
      res.setHeader('Cache-Control', response.headers.get('cache-control'));
    }
    
    // ================= PROCESSAR CONTEÚDO =================
    if (isHtml || isCss || isJs) {
      let content = await response.text();
      
      // Substituir todas as URLs do domínio original
      content = content.replace(
        new RegExp(TARGET_BASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        `https://${req.headers.host}`
      );
      
      // Substituir URLs relativas
      content = content.replace(
        /(href|src|action)=["'](\/[^"']*)["']/gi,
        `$1="https://${req.headers.host}$2"`
      );
      
      // Substituir URLs em CSS
      content = content.replace(
        /url\(['"]?(\/[^'")]*)['"]?\)/gi,
        `url(https://${req.headers.host}$1)`
      );
      
      // Para HTML, adicionar base tag
      if (isHtml && !content.includes('<base href')) {
        content = content.replace(
          /<head[^>]*>/i,
          `$&<base href="https://${req.headers.host}/">`
        );
      }
      
      res.end(content);
    } else {
      // Para imagens, fonts, etc. - retornar buffer
      const buffer = await response.arrayBuffer();
      res.end(Buffer.from(buffer));
    }
    
  } catch (error) {
    console.error('Erro:', error);
    res.statusCode = 502;
    res.setHeader('Content-Type', 'text/html');
    res.end(`
      <html><body>
        <h1>Erro 502</h1>
        <p>Falha ao carregar: ${req.url}</p>
        <p>Tente: https://${req.headers.host}/70145</p>
      </body></html>
    `);
  }
};
