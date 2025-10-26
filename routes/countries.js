const express = require("express");
const pool = require("../config/db.js");
const { fetchCountries, fetchRates } = require("../utils/fetchers.js");
const { generateSummaryImage } = require("../utils/imageGenerator.js");
const path = require("path");
const fs = require("fs/promises");

const router = express.Router();

function computeEstimatedGdp(population, exchange_rate) {
  if (exchange_rate === null || exchange_rate === undefined) return null;
  const randMultiplier = Math.random() * (2000 - 1000) + 1000; // 1000-2000
  return (population * randMultiplier) / exchange_rate;
}

function validateRecord(record) {
  const errors = {};
  if (!record.name) errors.name = "is required";
  if (record.population === undefined || record.population === null)
    errors.population = "is required";
  if (!record.currency_code) errors.currency_code = "is required";
  return Object.keys(errors).length ? errors : null;
}

router.post("/refresh", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [countriesData, ratesData] = await Promise.all([
      fetchCountries(),
      fetchRates(),
    ]);

    if (!countriesData)
      throw { status: 503, msg: "Could not fetch data from Countries API" };
    if (!ratesData)
      throw { status: 503, msg: "Could not fetch data from Rates API" };

    const rates = ratesData.rates || ratesData;
    const now = new Date();

    const records = countriesData.map((c) => {
      const name = c.name || null;
      const name_lower = name ? name.toLowerCase() : null;
      const capital = c.capital || null;
      const region = c.region || null;
      const population = Number(c.population) || 0;
      let currency_code = null;
      if (Array.isArray(c.currencies) && c.currencies.length > 0) {
        currency_code = c.currencies[0].code || null;
      }
      let exchange_rate = null;
      let estimated_gdp = null;
      if (!currency_code) {
        exchange_rate = null;
        estimated_gdp = 0;
      } else {
        const rate = rates[currency_code];
        if (rate === undefined) {
          exchange_rate = null;
          estimated_gdp = null;
        } else {
          exchange_rate = Number(rate);
          estimated_gdp = computeEstimatedGdp(population, exchange_rate);
        }
      }
      return {
        name,
        capital,
        region,
        population,
        currency_code,
        exchange_rate,
        estimated_gdp,
        flag_url: c.flag || c.flag_url || null,
        last_refreshed_at: now,
      };
    });

    await conn.beginTransaction();
    await conn.query("TRUNCATE TABLE countries");

    for (const r of records) {
      await conn.query(
        `INSERT INTO countries
          (name, name_lower, capital, region, population, currency_code, exchange_rate, estimated_gdp, flag_url, last_refreshed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          r.name,
          r.name_lower,
          r.capital,
          r.region,
          r.population,
          r.currency_code,
          r.exchange_rate,
          r.estimated_gdp,
          r.flag_url,
          r.last_refreshed_at,
        ]
      );
    }

    await conn.commit();

    const [allRows] = await conn.query("SELECT * FROM countries");
    const total = allRows.length;
    const top5 = allRows
      .filter((r) => r.estimated_gdp !== null && r.estimated_gdp !== undefined)
      .sort((a, b) => b.estimated_gdp - a.estimated_gdp)
      .slice(0, 5);
    const timestamp = new Date().toISOString();

    await generateSummaryImage(total, top5, timestamp);

    res.status(200).json({
      message: "Refresh successful",
      total_countries: total,
      last_refreshed_at: timestamp,
    });
  } catch (err) {
    await conn.rollback().catch(() => {});
    if (err.status === 503)
      return res
        .status(503)
        .json({ error: "External data source unavailable", details: err.msg });
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    conn.release();
  }
});

router.get("/", async (req, res) => {
  try {
    const { region, currency, sort } = req.query;
    let sql = "SELECT * FROM countries";
    const where = [];
    const params = [];
    if (region) {
      where.push("region = ?");
      params.push(region);
    }
    if (currency) {
      where.push("currency_code = ?");
      params.push(currency);
    }
    if (where.length) sql += " WHERE " + where.join(" AND ");
    if (sort === "gdp_desc") sql += " ORDER BY estimated_gdp DESC";
    const [rows] = await pool.query(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:name", async (req, res) => {
  try {
    const name = req.params.name;
    const [result] = await pool.query(
      "DELETE FROM countries WHERE name_lower = ?",
      [name.toLowerCase()]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Country not found" });
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/status", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT COUNT(*) AS total FROM countries");
    const [lastRows] = await pool.query(
      "SELECT MAX(last_refreshed_at) AS last_refreshed_at FROM countries"
    );
    const total = rows[0].total;
    const last = lastRows[0].last_refreshed_at;
    return res.json({ total_countries: total, last_refreshed_at: last });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/image", async (req, res) => {
  try {
    const p = path.join(process.cwd(), "cache", "summary.png");
    try {
      await fs.access(p);
    } catch {
      return res.status(404).json({ error: "Summary image not found" });
    }
    res.sendFile(p);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:name", async (req, res) => {
  try {
    const name = req.params.name;
    const [rows] = await pool.query(
      "SELECT * FROM countries WHERE name_lower = ? LIMIT 1",
      [name.toLowerCase()]
    );
    if (!rows.length)
      return res.status(404).json({ error: "Country not found" });
    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
