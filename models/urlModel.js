let mongoose = require('mongoose');
let URL = require('url').URL;


// Define url model
let urlSchema = new mongoose.Schema({
    originalUrl: {
        type: String,
        required: true,
        unique: true,
        validate: (val) => {
            try {
                const url = new URL(val);
                return true;
            }
            catch (e) {
                return false;
            }
        }
    },
    shortUrl: {
        type: Number,
        default: 1,
        required: true,
        unique: true
    }
});

// Export URL model
module.exports = mongoose.model('URLModel', urlSchema);