const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const https = require('https');

// Configure babel
require('@babel/register')({
  presets: [
    ['@babel/preset-env', { targets: { node: true } }]
  ]
});

const calendar = require('./calendar.js');

const app = express();
const port = 3001;

app.use(bodyParser.json());

app.post('/', async (request, response) => {
  let { url } = request.body;
  let agent = url.startsWith('https://') ? https : http;
  let options = {};
  if (request.headers.authorization) {
    options.headers = {Authorization: request.headers.authorization}
  }

  agent.get(url, options, icalResponse => {
    const { statusCode, headers } = icalResponse;
  
    let body = ''
    icalResponse.on('data', data => { body += data });
    icalResponse.on('end', () => {
      if (statusCode === 200) {
        let jcal = calendar.parse(body);
        response.json(calendar.reduce(jcal));
      } else {
        response.status(statusCode);
        if (statusCode === 401 && headers['www-authenticate']) {
          response.header('www-authenticate', headers['www-authenticate']);
        }
        response.send(body);
      }
    });
  });
});

app.listen(port, () => console.log(`Calendar server listening on port ${port}`));