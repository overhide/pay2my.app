const feesSchedule = require('../SharedCode/config.js')['fees-schedule'];
const overhide = require('../SharedCode/overhide.js');

/**
 * @param {res:..} context -- will contain the response 'res' which is a JSON payload `{featureUsed:true|false}` 
 *   indicating whether the feature was "make-pretend" used by the back-end
 * @param {query:..} req -- request object whereby query should have:
 *   - 'sku', see keys in 'feesSchedule.js' -- the gated feature name
 *   - 'currency', one of 'dollars', 'ethers', 'bitcoins'
 *   - 'from', ledger specific address of the customer (the 'from')
 *   - 'message', message signed to prove ownership of 'address'  (NOTE, this is base64 encoded)
 *   - 'signature', signature of 'message' for 'from'
 *   - 'isTest', whether testnet ledgers should be used for authorization
 */
module.exports = async function (context, req) {

  let featureUsed = false;

  try {
    const sku = req.query.sku;
    const currency = req.query.currency;
    const from = req.query.from;
    const isTest = req.query.isTest;
    const message = Buffer.from(req.query.message, 'base64').toString();
    const signature = Buffer.from(req.query.signature, 'base64').toString();
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

    if (await overhide.isValidOnLedger(uri, from, message, signature)
        && (costDollars === 0 
          || await overhide.isCostCovered(uri, from, to, costDollars, expiryMinutes))) {
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