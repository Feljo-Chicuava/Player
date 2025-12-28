const axios = require("axios");
const cheerio = require("cheerio");

module.exports = async function handler(req, res) {
  const { token } = req.query;

  if (token !== "1234") {
    return res.status(401).json({ error: "Token inválido" });
  }

  try {
    const response = await axios.get(
      "https://appzin.cineverseapp.store",
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );

    const $ = cheerio.load(response.data);
    const lista = [];

    $("div#genre_lancamentos article.item.movies").each((i, el) => {
      lista.push({
        titulo: $(el).find("div.data h3 a").text().trim()
      });
    });

    res.status(200).json({ status: true, resultados: lista });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
