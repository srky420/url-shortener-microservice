require('dotenv').config();
let express = require('express');
let app = express();
let bodyParser = require('body-parser');
let mongoose = require('mongoose');
let DNS = require('dns');
let { URL } = require('url');
let URLModel = require('./models/urlModel');


// Enable cors
let cors = require('cors');
app.use(cors({ optionsSuccessStatus: 200 })); // For older browsers

// Static files
app.use(express.static('public'));

// Use body-parser for application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// Validate URL Middleware
function validateUrl(req, res, next) {
    try {
        // Create URL obj
        const url = new URL(req.body.url);

        // Validate URL
        DNS.lookup(url.hostname, { all: true }, (err, adresses) => {
            if (err) {
                console.error(err)
                res.status(400).json({ error: 'Invalid URL' })
            }
            else {
                console.log(adresses);
                next();
            }
        });
    }
    catch (e) {
        console.error(e);
        res.status(400).json({ error: 'Invalid URL' })
    }
}

// Index route
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

// POST Shorturl route
app.post('/api/shorturl', validateUrl, function (req, res) {
    // Get url from body
    const url = req.body.url;

    // Create short URL (Pass the url and done function)
    createNewUrl(url, (err, doc) => {
        if (err) {
            res.status(400).json({ error: 'Unexpected error' });
        }
        else {
            res.status(201).json({
                original_url: doc.originalUrl,
                short_url: doc.shortUrl
            });
        }
    });
});

// GET Shorturl route
app.get('/api/shorturl/:shortUrl', function (req, res, next) {
    // Get URL param
    const shortUrl = req.params.shortUrl;

    // Validate URL param
    if (/^\d+$/.test(shortUrl)) {
        next();
    }
    else {
        res.status(400).json({ error: 'Wrong format' });
    }

}, async function (req, res) {

    // Query DB
    const url = await URLModel.findOne({ shortUrl: parseInt(req.params.shortUrl) });

    // If exists, redirect to originalUrl
    if (url) {
        originalUrl = new URL(url.originalUrl);
        res.status(302).redirect(originalUrl);
    }
    else {
        res.status(400).json({ error: 'No short url found' })
    }
});

// Create new url in DB
const createNewUrl = async (url, done) => {

    // Check if already exists
    const existingUrl = await URLModel.findOne({ originalUrl: url });
    if (existingUrl) {
        return done(null, existingUrl);
    }

    // Get number of docs
    const count = await URLModel.countDocuments();

    // Create new doc and set short url to count + 1
    const doc = new URLModel({
        originalUrl: url,
        shortUrl: count + 1
    });

    // Save the doc
    doc.save()
        .then(doc => done(null, doc))
        .catch(err => done(err))
}

// Start server
const start = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        let listener = app.listen(process.env.PORT || 3000, function (req, res) {
            console.log('App listening on port ' + listener.address().port)
        })
    }
    catch (e) {
        console.error(e);
        process.exit(1);
    }
}

start();
