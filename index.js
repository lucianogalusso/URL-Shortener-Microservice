require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const mongoose = require('mongoose');
const crypto = require('crypto');
const app = express();

const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const Schema = mongoose.Schema;

const urlSchema = new Schema({
  originalUrl: { type: String, required: true },
  hash: String
});

const URLDB = mongoose.model("Url", urlSchema);

// Middleware para manejar datos codificados como URL
app.use(express.urlencoded({ extended: true }));

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl', function(req, res) {

  const body = req.body;
  const length = 20;

  if (body === undefined)
    return res.json({ error : "invalid url"});

  const urlInput = body.url;
  console.log(urlInput);

  let domain;

  try {
    const parsedUrl = new URL(urlInput);
    domain = parsedUrl.hostname;
  } catch (error) {
    return res.json({ error: "invalid url" });
  }

  console.log(domain);

  dns.lookup(domain, (err, address, family) => {
    console.log(err);
    if (err)
      return res.json({ error : "invalid url"});
    
    // let hash = crypto.createHash('sha256').update(url).digest('hex');
    // hash = hash.slice(0, length);

    let url = new URLDB({
      originalUrl: urlInput, 
      hash: "a"
    });

    console.log(url);
  
    url.save()
      .then((savedUrl) => {
        return res.json({ original_url: urlInput, short_url: savedUrl._id });
      })
      .catch((err) => {
        return res.json({ error : "invalid url"});
      });

  });

});

app.get('/api/shorturl/:id', function(req, res) {

  const id = req.params.id;

  if (id === undefined)
    return res.json({ error : "invalid url"});

  console.log(id);

  URLDB.findById(id)
    .then((url) => {
      if (!url) {
        console.log('URL not found for ID:', id);
        return res.json({ error: "invalid url" });
      }
      
      console.log('Redirecting to:', url.originalUrl);

      if (typeof url.originalUrl !== 'string') {
        return res.json({ error: "invalid url" });
      }

      return res.redirect(url.originalUrl);
    })
    .catch((err) => {
      return res.json({ error : "invalid url"});
    });

});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
