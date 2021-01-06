const express = require('express');
const router = express.Router();
const request = require('request-promise');
// const parseString = require('xml2js').parseString;
const redis = require('redis');

const redis_port = process.env.REDIS_PORT || 6379;
const redisClient = redis.createClient(redis_port);
const api_key = process.env.GOOGLE_BOOKS_API_KEY

// search cache middleware
function searchCache(req, res, next) {
  const { query } = req.params;

  redisClient.get(query, (err, data) => {
    if (err) throw err;

    if (data !== null) {
      console.log('Fetching from cache ..');
      res.status(200).send(JSON.parse(data));
    } else {
      next();
    }
  });
}

// book cache middleware
function bookCache(req, res, next) {
  const { id } = req.params;

  redisClient.get(id, (err, data) => {
    if (err) throw err;

    if (data !== null) {
      console.log('Fetching from cache ..');
      res.status(200).send(JSON.parse(data));
    } else {
      next();
    }
  });
}

//main route
router.get('/', (req, res) => {
  res.send('This is a test response ...')
  // console.log('Test response for base URL')
})

// Books search
router.get('/books/:query', searchCache, (req, res) => {
  const { query } = req.params;
  request
    .get(
      `https://www.googleapis.com/books/v1/volumes?q=${query}&key=${api_key}`,
    )
    .then((result) => {
      redisClient.set(query, result)
      console.log('Fetching from API ..');
      res.status(200).send(JSON.parse(result))
    })
    .catch((err) => {
      // console.error(err);
      res.status(500).json({
        message: 'Server Error',
        Error: err
      });
    });
});

// Get book by id
router.get('/book/:id', bookCache, (req, res) => {
  const { id } = req.params;
  request
    .get(
      `https://www.googleapis.com/books/v1/volumes/${id}?projection=lite&key=${api_key}`,
    )
    .then((result) => {
      redisClient.set(id, result)
      console.log('Fetching data from API')
      res.status(200).send(JSON.parse(result))
    })
    .catch((err) => {
      // console.error(err);
      res.status(500).json({
        message: 'Incorrect book ID, No book found for this ID!',
        Error: err
      });
    });
});

module.exports = router;
