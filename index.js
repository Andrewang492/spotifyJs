const express = require('express')
const querystring = require('node:querystring'); 

const port = 8888;

var client_id = '7da9513d8a1b44b9b9494cb0ed061466';
var redirect_uri = 'http://localhost:8888/callback';

var app = express();

app.get('/', (req, res) => {
    res.send('Home page for spoitfy app express 3')
})

app.get('/callback', (req, res) => {
    // console.log(req);
    console.log(JSON.stringify(req.body));
    console.log('_______________')
    console.log(req.params)
    console.log(req.query)
    console.log(req.query.code)
    res.send('redirectred')
})

app.get('/login', function(req, res) {

//   var state = generateRandomString(16);
  var scope = 'user-read-private user-read-email playlist-read-collaborative';

  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
    //   state: state
    }));
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}\n http://localhost:${port}`)
  })