const feesSchedule = require('../SharedCode/config.js')['fees-schedule'];
const overhide = require('../SharedCode/overhide.js');

/**
 * @param {res:..} context -- will contain the response 'res' which is a JSON payload `{featureUsed:true|false}` 
 *   indicating whether the feature was "make-pretend" used by the back-end
 * @param {query:..,headers} req -- request object whereby query should have:
 *   - 'sku', see keys in 'feesSchedule.js' -- the gated feature name
 *   - 'currency', one of 'dollars', 'ethers', 'bitcoins'
 *   - 'from', ledger specific address of the customer (the 'from')
 *   - 'isTest', whether testnet ledgers should be used for authorization
 *   - 'asOf' cache key to make request against back-end quota and not get 429s
 *   
 *   The header of the request must have an `Authorization` header in the format `Bearer ${message}:${signature}`.
 *   - 'token', base64 string containing token to be signed to prove ownership of 'address': will be the token retrieved by `getToken` earlier.
 *   - 'tokenSignature', base64 string containing signature of 'token', signed by 'from'
 */
module.exports = async function (context, req) {

  let featureUsed = false;

  try {
    const sku = req.query.sku;
    const currency = req.query.currency;
    const from = req.query.from;
    const isTest = req.query.isTest;
    const asOf = req.query.asOf;
    const authZ = req.headers['authorization'];
    const [token, tokenSignature] = overhide.extractTokenFromHeader(authZ);
    const to = feesSchedule[sku].address[currency];
    const costDollars = +feesSchedule[sku].costDollars;
    const expiryMinutes = +feesSchedule[sku].expiryMinutes || null;

    switch(currency) {
      case 'ethers':
        var uri = isTest ? 'https://rinkeby.ethereum.overhide.io' : 'https://ethereum.overhide.io';
        break;
      case 'bitcoins':
        var uri = isTest ? 'https://test.bitcoin.overhide.io' : 'https://bitcoin.overhide.io';
        break;
      case 'dollars':
        var uri = isTest ? 'https://test.ledger.overhide.io/v1' : 'https://ledger.overhide.io/v1';
        break;
      default:
        throw `invalid currency: ${currency}}`;
    } 

    if (await overhide.isValidOnLedger(uri, from, token, tokenSignature)
        && (costDollars === 0 
          || await overhide.isCostCovered(uri, from, token, tokenSignature, to, costDollars, expiryMinutes, asOf))) {
      featureUsed = true;
    }
  } catch (e) {
    console.log(e);
  }

  if (featureUsed) {
    context.res = {
      status: 200,
      body: {
        featureUsed: true
      },
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }
  else {
    context.res = {
      status: 401,
      body: "Unauthorized by Ledger-Based AuthZ",
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }
};