require('dotenv').config();
let express = require('express');
let app = express();
let bodyParser = require('body-parser');
let mongoose = require('mongoose');
let DNS = require('dns');
let { URL, parse } = require('url');
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
                res.json({ error: 'Invalid URL' })
            }
            else {
                console.log(adresses);
                next();
            }
        });
    }
    catch (e) {
        console.error(e);
        res.json({ error: 'Invalid URL' })
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

    // Create

    res.json({
        originalUrl: url,
        shortUrl: ''
    })
});


// Queries
const createNewURL = (url, done) => {
    const newUrl = new URLModel({
        originalUrl: url,
        shortUrl: ''
    })
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
