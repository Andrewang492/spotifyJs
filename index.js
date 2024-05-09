const express = require('express')
require('dotenv').config()

const querystring = require('node:querystring'); 
const generateRandomString = require('./randomString.js');
const {getCurrentContext} = require('./scripts/client.js');
const {Shuffler} = require('./scripts/random.js');
const { redirect } = require('express/lib/response.js');
const port = 8888;

const baseurl = process.env.BASE_URL;
// const baseurl = 'https://spotifyshufflejs.onrender.com';
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
var redirect_uri = `${baseurl}/callback`;

var scope = `
  user-read-playback-state 
  user-modify-playback-state 
  user-read-currently-playing
  user-read-recently-played
  `;

var app = express();
let state = null;

let accessToken = null;
let refreshToken = null;

app.get('/', (req, res) => {
    res.send(
    `<h1>Home page for spoitfy app express 3<h1> 
    <h2>subtitle?<h2>    
    <a href="/login"><button>login</button></a>
    <a href="/s"><button>some info</button></a>
    <a href="/shuffle"><button>shuffle</button></a>
    <a href="/recent"><button>recently played</button></a>

    `)
})

app.get('/callback', (req, res) => {
    let code = req.query.code;
    if (state !== req.query.state) {
      console.error('the state string is not the same.')
      res.send('state error');
      return;
    }

    fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64'))
      }, //Buffer encodes the client id and secret.
      body: `code=${code}&redirect_uri=${redirect_uri}&grant_type=authorization_code`,
    })
    .then((fetchRes) => {
      return fetchRes.json();
    })
    .catch((err) => {
      console.error("couldn't authorise.");
      console.error(`${err}`);
    })
    .then((jsonRes) => {
      accessToken = jsonRes.access_token;
      // console.log('___________')
      console.log(jsonRes);
      // console.log(accessToken);
      // res.send('redirected')
      res.redirect('/');
    })
    .catch((err) => {
      console.error("couldn't change to json.");
      console.error(`${err}`);
    })
})

app.get('/login', function(req, res) {

  state = generateRandomString(16);

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

app.get('/np', (req, res) => {
  if (accessToken === null) {
    res.send('unauthorised access token');
    return;
  }

  fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: {
      Authorization: 'Bearer ' + accessToken
    }})
  .then(fetchRes => fetchRes.json())
  .then((body) => {
    if (body.context && body.item) {
      const trackName = body.item.name;
      const contextUri = body.context.uri.split(':')[2];
      console.log(`uri of context: ${contextUri}`);
      return fetch(`https://api.spotify.com/v1/playlists/${contextUri}`, {
        headers: {
          Authorization: 'Bearer ' + accessToken
        }})
    }
  })
  .then(fetchRes => fetchRes.json())
  .then((body) => {
    let final = "";
    if (body?.tracks?.items) {
      body.tracks.items.forEach((e) => {
        final += `${e.track.name}\n`
      })
      res.send({songs: final});
    } else {
      res.send(body);
    }
  })
});

app.get('/s', (req, res) => {
  if (accessToken === null) {
    res.send('unauthorised access token');
    return;
  }

  fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: {
      Authorization: 'Bearer ' + accessToken
    }})
  .then(fetchRes => fetchRes.json())
  .then((body) => {
    if (body.context && body.item) {
      const trackName = body.item.name;
      const contextUri = body.context.uri.split(':')[2];
      console.log(`uri of context: ${contextUri}`);
      return fetch(`https://api.spotify.com/v1/playlists/${contextUri}`, {
        headers: {
          Authorization: 'Bearer ' + accessToken
        }})
    }
  })
  .then(fetchRes => fetchRes.json())
  .catch(fetchRes => {
    console.error("uri unable to be fetched from. are you playing anything currently?");
    res.redirect('/')
  })
  .then((body) => {
    if (body?.tracks?.items) {
      let songs_html = body.tracks.items.map((e) => {
        return `<h6>${e.track.name} : ${e.track.id}<h6>`
      })
      .join('\n');
      
      res.send(
      `
        <h1>shuffled<h1> 
        ${songs_html}
        <a href="/"><button>home</button></a>
      `
     );
    } else {
      // if we didn't get songs, shows error.
      res.send(body);
    }
  })
});

app.get('/shuffle', function(req, res) {
  if (accessToken === null) {
    res.send('unauthorised access token');
    return;
  }

  // get current context.
  getCurrentContext(accessToken)
  .then((context) =>{
    console.log(context);
    if (!context) {
      throw new Error(`invalid context`);
    }
    return fetch(`${context.href}`, {
        headers: {
          Authorization: 'Bearer ' + accessToken
        }})
  })
  .then((fetchRes) => fetchRes.json())
  .then((body) => {
    const uris = body.tracks.items.map((e) => e.track.uri);
    const songInfo = new Map(body.tracks.items.map((e) => [e.track.uri, {name: e.track.name, duration_ms: e.track.duration_ms}]))
    let s = new Shuffler(uris);
    let urisQueue = [];

    {
      // choose first song (special interaction with map)
      let uriToPlay = s.getRandomObjectFair();
      const currWeights = s.getWeights();
      let newWeights = [...currWeights.keys()].reduce((map, object) => {
        let newWeight = object === uriToPlay ? 0 : 1;
        map.set(object, newWeight);
        return map;
      }, new Map());
      urisQueue.push(uriToPlay);
      s.setWeights(newWeights);
    }
    
    // select rest of songs.
    let i = 1;
    while (i < 50) {
      let uriToPlay = s.getRandomObject();
      const currWeights = s.getWeights();
      let newWeights = new Map();
      // console.log(currWeights.values());
      // console.log(currWeights.keys());
      for ([object, value] of currWeights) {
        if (object === uriToPlay) {
          newWeights.set(object, 0);
        } else {
          newWeights.set(object, value + 1); // add 1. Could be based off song length instead.
        }
      }
      // console.log(`setting weights to `);
      // console.log(newWeights.values());
      s.setWeights(newWeights);
      urisQueue.push(uriToPlay);
      i += 1
    }
    
    // no shuffle
    fetch('https://api.spotify.com/v1/me/player/shuffle?state=false', {
      headers: { Authorization: 'Bearer ' + accessToken},
      method: "PUT"
    });
    // no repeat
    fetch('https://api.spotify.com/v1/me/player/repeat?state=off', {
      headers: { Authorization: 'Bearer ' + accessToken},
      method: "PUT"
    });
    
    console.log(urisQueue);
    // play, then send what was queued.
    fetch('https://api.spotify.com/v1/me/player/play', {
      headers: {Authorization: 'Bearer ' + accessToken},
      method: "PUT",
      body: JSON.stringify({
        "uris": urisQueue,
        "position_ms": 0
      })
    })
    .then(fetchRes => {
      if (fetchRes.status === 204) {
        return {}
      }
      return fetchRes.json()
    })
    .then((body) => {
      const namesQueue = urisQueue.map((uri) => {return songInfo.get(uri).name});
      console.log(body);
      res.send(
        `
          <h1>shuffled<h1> 
          ${urisQueue.join('<br>')}
          <hr>
          ${namesQueue.join('<br>')}
          <a href="/"><button>home</button></a>
        `
       );
    })
  })
  .catch(err => {
    console.error(err);
    res.send(` error: ${err}`);
  });


});

app.get('/recent', function(req, res){
  if (accessToken === null) {
    res.send('unauthorised access token');
    return;
  }

  fetch(`https://api.spotify.com/v1/me/player/recently-played?limit=50&before=${Date.now()}`, {
      headers: {
        Authorization: 'Bearer ' + accessToken
      }})
      .then(fetchRes => fetchRes.json())
      .then((body) => {
        console.log("got recent track.")
        console.log(body);
        res.send(body.items.map(item => item.track.name));

      })
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}\n http://localhost:${port}`)
  })
