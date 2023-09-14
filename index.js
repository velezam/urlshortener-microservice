require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const dns = require("node:dns");

const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: String,
});

const URLs = new mongoose.model("URLs", urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

app.post("/api/shorturl", function (req, res) {
  let url;

  try {
    url = new URL(req.body.url);
  } catch (error) {
    return res.json({ error: "invalid url" });
  }

  dns.lookup(url.hostname, async (err, address) => {
    if (!address) {
      res.json({ error: "invalid url" });
    } else {
      const urlCount = await URLs.countDocuments({});

      const existingDoc = await URLs.findOne({ original_url: url });

      if (existingDoc) {
        res.json({
          original_url: existingDoc.original_url,
          short_url: existingDoc.short_url,
        });
      } else {
        await URLs.create({
          original_url: url,
          short_url: urlCount,
        });

        res.json({
          original_url: url,
          short_url: urlCount,
        });
      }
    }
  });
});

app.get("/api/shorturl/:shorturl", async function (req, res) {
  const short_url = req.params.shorturl;

  const url = await URLs.findOne({ short_url: short_url });

  if (!url) return res.json({ error: "invalid url" });

  res.redirect(url.original_url);
});
