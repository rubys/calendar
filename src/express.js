const express=require('express');
const fs = require('fs');

// Configure babel to handle class properties and JSX
require('@babel/register')({
  presets: [
    ['@babel/preset-env', {targets: {node: true}}]
  ]
});

const calendar = require('./calendar.js');

const app = express();
const port = 3001;

let rubyhome = fs.readFileSync('/home/rubys/tmp/rubyhome.ics', 'utf8');

app.post('/', (request, response) => {
  let jcal = calendar.parse(rubyhome);
  response.json(calendar.reduce(jcal));
});

app.listen(port, () => console.log(`Calendar server listening on port ${port}`));