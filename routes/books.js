const express = require('express');
const router = express.Router();
const request = require('request-promise');
const parseString = require('xml2js').parseString;
const redis = require('redis');

const redis_port = process.env.REDis_PORT || 6379;
const client = redis.createClient(redis_port);

// search cache middleware
function searchCache(req, res, next) {
  const { query } = req.params;

  client.get(query, (err, data) => {
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

  client.get(id, (err, data) => {
    if (err) throw err;

    if (data !== null) {
      console.log('Fetching from cache ..');
      res.status(200).send(JSON.parse(data));
    } else {
      next();
    }
  });
}

// Books search
router.get('/books/:query', searchCache, (req, res) => {
  const { query } = req.params;
  request
    .get(
      `https://www.goodreads.com/search/index.xml?key=${process.env.GOODREADS_API_KEY}&q=${query}`,
    )
    .then(result => {
      parseString(result, (err, searchResult) => {
        if (err) {
          console.error(err);
          res.status(401).json({ message: 'No Matchingg Books!' });
        } else {
          // set cache value
          client.set(query, JSON.stringify(searchResult));
          console.log('Fetching from API ..');
          res.status(200).send(searchResult);
        }
      });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: 'Server Error' });
    });
});

// Get book by id
router.get('/book/:id', bookCache, (req, res) => {
  const { id } = req.params;
  request
    .get(
      `https://www.goodreads.com/book/show/${id}.xml?key=${process.env.GOODREADS_API_KEY}`,
    )
    .then(result => {
      parseString(result, (err, bookresult) => {
        if (err) {
          console.error(err);
          res.status(401).json({ message: 'Book Not Found!' });
        } else {
          const search = bookresult.GoodreadsResponse.book;
          //store cached value
          client.set(id, JSON.stringify(search));
          console.log('Fetching from API..');
          res.status(200).send(search);
        }
      });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: 'Server Error!' });
    });
});

module.exports = router;
