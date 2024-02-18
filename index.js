const express = require('express')
const querystring = require('node:querystring'); 
const generateRandomString = require('./randomString.js')
const port = 8888;

var client_id = '7da9513d8a1b44b9b9494cb0ed061466';
const client_secret = 'af6fc6286d934d40b3bf916397a6afb5';
var redirect_uri = 'http://localhost:8888/callback';

var app = express();
let state = null;

let accessToken = null;
let refreshToken = null;

app.get('/', (req, res) => {
    res.send('Home page for spoitfy app express 3')
})

app.get('/callback', (req, res) => {
    // console.log(req);
    console.log(req.query)
    console.log(req.query.code)
    code = req.query.code;
    if (state !== req.query.state) {
      console.error('the state string is not the same.')
      res.send('state eorrr');
      return;
    }

    fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64'))
      }, //Buffer encodes the thing.
      body: `code=${code}&redirect_uri=${redirect_uri}&grant_type=authorization_code`,
    })
    .then((fetchRes) => {
      console.log('Response from fetch for access token')
      return fetchRes.json();
    })
    .then((jsonRes) => {
      console.log('___________')
      console.log(jsonRes);
      accessToken = jsonRes.access_token;
      console.log(accessToken);
      res.send('redirected')
    })
    // res.send('redirected without fetching...')

})

app.get('/login', function(req, res) {

  state = generateRandomString(16);
  var scope = 'user-read-private user-read-email playlist-read-collaborative';

  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/someTrack', (req, res) => {
  if (accessToken === null) {
    res.send('unauthorised access token');
    return;
  }

  fetch('https://api.spotify.com/v1/tracks/3xMnPIvsaWwzHzqqzaihEX', {
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  })
  .then(fetchRes => fetchRes.json())
  .then((body) => {
    res.send(JSON.stringify(body));
  })
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}\n http://localhost:${port}`)
  })