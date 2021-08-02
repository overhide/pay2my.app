const feesSchedule = require('../SharedCode/config.js')['fees-schedule'];

/**
 * @param {res:..} context -- will contain the response 'res' which is a JSON payload `{schedule:..}` 
 *   which is the fees schedule as per `SharedCode/feesSchedule.js`
 * @param {query:..} req -- request object, not parsed
 */
module.exports = async function (context, req) {
  context.res = {
    status: 200,
    body: {
      schedule: feesSchedule
    },
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*' 
    }
  };
};