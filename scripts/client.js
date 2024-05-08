const PLAYED_AFTER = 1704067200000 // start of 2024.

function getCurrentContext(accessToken) {
  return fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: {
      Authorization: 'Bearer ' + accessToken
    }})
  .then(fetchRes => fetchRes.json())
  .then((body) => {
    if (body.context && body.item) {
      return body.context
    } else {
      throw new Error("no context found after fetching")
    }
  })
  .catch(err =>{ 
    console.log("Current context unfetchable. Fetching most recent context.")
    console.log(err);
    
    // return most recent context instead
    return fetch(`https://api.spotify.com/v1/me/player/recently-played?limit=50&after=${PLAYED_AFTER}`, {
      headers: {
        Authorization: 'Bearer ' + accessToken
      }})
      .then(fetchRes => fetchRes.json())
      .then((body) => {
        console.log("got recent track.")
        for (item of body.items) {
          if (item.context !== null) {
            return item.context; 
          }
        }
      })
  })
}

module.exports = {
  getCurrentContext
};