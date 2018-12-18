const express = require('express');
const cache = require('memory-cache');
const axios = require('axios');
const moment = require('moment');

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;

const server = express();
const IG_POSTS_CACHE_KEY = 'ig_posts';

const getInstagramImages = () => {
  return new Promise((resolve, reject) => {
    const cacheContent = cache.get(IG_POSTS_CACHE_KEY);
  
    if (cacheContent == null) {
  
      axios.get('https://api.instagram.com/v1/users/self/media/recent?access_token=' + INSTAGRAM_ACCESS_TOKEN).then(res => {
        const images = [];
  
        res.data.data.forEach(element => {
          images.push({
            id: element.id,
            image: element.images.standard_resolution.url,
            caption: element.caption.text,
            url: element.link,
            date: moment.unix(element.created_time).format("DD-MM-YYYY HH:mm:ss")
          });
        });
  
        cache.put(IG_POSTS_CACHE_KEY, images, 1000*60*24*3);
  
        resolve(images);
      }).catch(ex => reject(ex));
  
      return;
    }
  
    resolve(cacheContent);
  });
}

server.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

server.get('/instagram-posts', (request, response) => {
  if (INSTAGRAM_ACCESS_TOKEN == null) {
    return response.status(500).send();
  }

  getInstagramImages().then(posts => {
    response.send(posts);
  })
});

server.listen(PORT, HOST, () => {
  console.log(`Listening on ${HOST}:${PORT}`);
});
