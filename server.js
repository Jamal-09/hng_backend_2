const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const countriesRouter = require("./routes/countries.js");

require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) =>
  res.json({ message: "Country Currency & Exchange API" })
);

app.use("/countries", countriesRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
