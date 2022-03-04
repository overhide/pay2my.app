const fetch = require('node-fetch');

// The API key to get token for.
const API_KEY = require('../SharedCode/config.js')['api-key'];

/**
 * Retrieve API access token
 * 
 * @returns {string} the token.
 */
async function getToken() {
  const tokenUrl = `https://token.overhide.io/token`;
  const url = `${tokenUrl}?apikey=${API_KEY}`;

  console.log('retrieving token for APIs');
  return fetch(url, {
    method: 'GET'
  }).then(result => {
    if (result.status == 200) {
      return result.text();
    } else {
      throw(JSON.stringify({url: url, status: result.status, error: result.message}));
    }
  }).then(token => {
    console.log('successfuly retrieved token for APIs');
    return token;
  }).catch(e => {
    console.log('failed to get token for APIs: ' + e);
  });
}

/**
 * Call overhide remuneration API to get transaction tally for determining authority tiers
 * 
 * @param {string} uri - of overhide remuneration provider API
 * @param {string} from - tally transactions from this address 
 * @param {string} token - valid token to be signed by `from`: : will be the token retrieved by `getToken` earlier and provided back from client.
 * @param {string} signature - signature for `token` signed by `from`.
 * @param {string} to - tally transactions to this address
 * @param {Date} date - 'null' for all-time, or date since when to tally transactions
 * @param {string} asOf - key to make request against back-end quota and not get 429s
 * @returns {string} tally in remuneration provider's denomination
 */ 
async function getTallyDollars(uri, from, token, signature, to, date, asOf) {
  let since = '';
  if (date) {
    since = `&since=${date.toISOString()}`;
  }

  const signedTokenB64 = Buffer.from(signature).toString('base64')
  uri = `${uri}/get-transactions/${from}/${to}?tally-only=true&tally-dollars=true${since}&signature=${signedTokenB64}&as-of=${asOf}`;
  console.log(`remunaration API >> getTally call (${uri})`);

  return await fetch(uri, {headers: { "Authorization": `Bearer ${token}` }})
    .then(res => res.json())
    .then(res => {
      console.log('remunaration API >> getTally call OK');
      return res.tally;
    })
    .catch(e => {
      console.log('remunaration API >> getTally call ERROR');
      throw String(e)
    });
}


module.exports = {
  /**
   * Retrieve API access token
   * 
   * @returns {string} the token.
   */
  getToken: getToken,

  /**
   * Extracts token and corresponding signature of said token from `Authorization` header value passed in: parses this header value.
   * 
   * The client is to send an authorization header matching:  `Bearer ${token}:${signature}` 
   * 
   * where:
   *   - ${token} is the base64 value of the token retrieved earlier with the above `getToken(..)`.
   *   - ${signature} is the base64 value of the signature of ${token}, signed with the `from`  addressed passed into these functions.
   * 
   * @param {string} headerValue - the header value to parse
   * @returns {[token,signature]} strings containing the token and signature
   */
  extractTokenFromHeader: (headerValue) => {
    const tokenBase64 = headerValue.match(/Bearer ([^:]+):([^:]+)/)[1];
    const tokenSignatureBase64 = headerValue.match(/Bearer ([^:]+):([^:]+)/)[2];
    const token = Buffer.from(tokenBase64, 'base64').toString();
    const tokenSignature = Buffer.from(tokenSignatureBase64, 'base64').toString();
    return [token, tokenSignature];
  },

  /**
   * Determine if cost is covered withing the number of days on the ledger
   * 
   * @param {string} uri - of overhide remuneration provider API
   * @param {string} from - tally transactions from this address
   * @param {string} token - valid token to be signed by `from`: : will be the token retrieved by `getToken` earlier and provided back from client.
   * @param {string} signature - signature for `token` signed by `from`.
   * @param {string} to - tally transactions to this address
   * @param {number} costDollars - amount of dollars (USD) to cover
   * @param {number} tallyMinutes - if null, all time, else number of minutes since now
   * @param {string} asOf - key to make request against back-end quota and not get 429s
   */
  isCostCovered: async (uri, from, token, signature, to, costDollars, tallyMinutes, asOf) => {
    if (tallyMinutes) {
      let since = new Date();
      since.setMinutes(since.getMinutes() - tallyMinutes);
      var tallyDollars = await getTallyDollars(uri, from, token, signature, to, since, asOf);
    } else {
      var tallyDollars = await getTallyDollars(uri, from, token, signature, to, null, asOf);
    }
    var delta = costDollars - tallyDollars;
    return delta <= 0;
  },

  /**
   * Call overhide remuneration API to check validity of signature for address
   * 
   * @param {string} uri - of overhide remuneration provider API
   * @param {string} address - to check
   * @param {string} token - valid token to be signed by `from`: : will be the token retrieved by `getToken` earlier and provided back from client.
   * @param {string} signature - signature for `token` signed by `from`.
   * @returns {boolean}
   */
  isValidOnLedger: async (uri, address, token, signature) => {
    const body = JSON.stringify({
      signature: Buffer.from(signature).toString('base64'),
      message: Buffer.from(token).toString('base64'),
      address: address
    });
    uri = `${uri}/is-signature-valid?skip-ledger=true`  /* skip-ledger here allows us to use back-end rate limits and get less 429s. */

    console.log(`remunaration API >> isValidOnLedger call (uri: ${uri}) (body: ${body})`);

    return await fetch(uri, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Bearer ${await getToken()}`
      },
      body: body
    })
    .then((result) => {
      if (result.status == 200) {
        console.log('remunaration API >> isValidOnLedger OK');
        return true;
      } else {
        console.log('remunaration API >> isValidOnLedger NOTOK');
        return false;
      }
    })
    .catch(e => {
      console.log('remunaration API >> isValidOnLedger ERROR');
      throw String(e)
    });
  },
}