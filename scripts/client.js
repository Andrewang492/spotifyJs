
const PLAYED_AFTER = 1704067200000 // start of 2024.
const { fromUnixTime, parseISO, format } = require("date-fns");

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
    return returnMostRecentContext(accessToken, 0, after = PLAYED_AFTER);
    /*
    return fetch(`https://api.spotify.com/v1/me/player/recently-played?limit=50&after=${PLAYED_AFTER}`, {
      headers: {
        Authorization: 'Bearer ' + accessToken
      }})
      .then(fetchRes => fetchRes.json())
      .then((body) => {
        console.log("got recent tracks.");
        console.log(`length of recent tracks list: ${body.items.size}`);
        console.log(body);
        for (item of body.items) {
          if (item.context !== null) {
            return item.context; 
          }
        }
      })
      */
  })
}

function returnMostRecentContext(accessToken, recursionDepth, after = null, before = null) {
  if (recursionDepth >= 5) {
    throw new Error("could not find a recent context, search depth too deep.");
  }

  let recentlyPlayedFetch;
  if (after !== null) {
    recentlyPlayedFetch = fetch(`https://api.spotify.com/v1/me/player/recently-played?limit=50&after=${after}`, {
      headers: {
        Authorization: 'Bearer ' + accessToken
      }}) 
  }
  if (before !== null) {
    recentlyPlayedFetch = fetch(`https://api.spotify.com/v1/me/player/recently-played?limit=50&before=${before}`, {
      headers: {
        Authorization: 'Bearer ' + accessToken
      }}) 
  }

  return recentlyPlayedFetch
    .then(fetchRes => fetchRes.json())
    .then((body) => {
      console.log(body.href);

      console.log(body.items.map((item) => {
        const timestamp = parseISO(item.played_at);
        return `${item.track.name.padEnd(50)} at ${format(timestamp, 'HH:mm:ss dd/MM/yyyy')}`
      }));

      if (body.cursors === null) {
        console.error('no before or after');
        console.error(body);
      }
      
      let before_date = fromUnixTime(parseInt(body.cursors.before)/1000);
      let after_date = fromUnixTime(parseInt(body.cursors.after)/1000);

      console.log(`between before: ${before_date} and after: ${after_date}`);
      for (item of body.items) {
        if (item.context !== null) {
          return item.context; 
        }
      }
      // all of last 50 didnt have any context. Look again.
      return returnMostRecentContext(accessToken, recursionDepth + 1, after = null, before = body.cursors.before);

      // fetch(`https://api.spotify.com/v1/me/player/recently-played?limit=50&before=${body.cursors.before}`, {
      //   headers: {
      //   Authorization: 'Bearer ' + accessToken
      // }})
      // .then(fetchRes => fetchRes.json())
      // .then((body) => {
      //   for (item of body.items) {
      //     if (item.context !== null) {
      //       return item.context; 
      //     }
      //   }
      // })

    })
}

module.exports = {
  getCurrentContext
};