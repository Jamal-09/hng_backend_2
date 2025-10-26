const axios = require("axios");
require("dotenv").config();

const COUNTRIES_URL = process.env.EXTERNAL_COUNTRIES_API;
const RATES_URL = process.env.EXTERNAL_RATES_API;

async function fetchCountries() {
  const res = await axios.get(COUNTRIES_URL, { timeout: 15000 });
  return res.data;
}

async function fetchRates() {
  const res = await axios.get(RATES_URL, { timeout: 15000 });
  return res.data;
}

module.exports = { fetchCountries, fetchRates };
