const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const NodeCache = require('node-cache');

const app = express();
const cache = new NodeCache({ stdTTL: 86400 }); // Cache de 24h

const URL = 'https://appzin.cineverseapp.store';

app.get('/api/series-recentes', async (req, res) => {
    const cached = cache.get('seriesRecentes');
    if (cached) return res.json(cached);

    try {
        const { data: html } = await axios.get(URL);
        const $ = cheerio.load(html);

        const lista = [];
        $('div#dt-tvshows article.item.tvshows').each((i, el) => {
            const id = $(el).attr('id') || '';
            const imagem = $(el).find('div.poster img').attr('src') || '';
            const rating = $(el).find('div.rating').text() || '';
            const linkTag = $(el).find('div.data h3 a');
            const titulo = linkTag.text() || '';
            const link = linkTag.attr('href') || '';
            const dataLancamento = $(el).find('div.data span').text() || '';

            lista.push({ id, titulo, imagem, rating, data: dataLancamento, link });
        });

        cache.set('seriesRecentes', lista);
        res.json(lista);
    } catch (e) {
        console.error(e.message);
        res.status(500).json({ error: 'Falha ao obter dados' });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API rodando na porta ${port}`));
