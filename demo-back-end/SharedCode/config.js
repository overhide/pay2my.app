
module.exports = {
  // The overhide API key to retrieve the token.
  //
  // See https://token.overhide.io/swagger.html
  //
  // The key used below is a static test key used for demos.
  'api-key': '0x___API_KEY_ONLY_FOR_DEMOS_AND_TESTS___',

  // Configure this fees schedule in US dollars for the different ledgers.
  //
  // The fees-schedule is keyed by SKU (feature/up-sell/add-on name).
  //
  // Each SKU can have a cost in dollars that's checked against the configured ledgers.
  //
  // The addresses per ledger are your receipt addres.
  //
  // You only need to configure the addresses that for the ledgers you use in the front-end (e.g. you can skip bitcoin)
  'fees-schedule': {
    'free-feature': {
      'expiryMinutes': 0,
      'costDollars': 0,
      'address': {
        'dollars': '0x046c88317b23dc57F6945Bf4140140f73c8FC80F',
        'ethers': '0x046c88317b23dc57F6945Bf4140140f73c8FC80F',
        'bitcoins': 'tb1qr9d7z0es86sps5f2kefx5grpj4a5yvp4evj80z'
      }
    },
    'paid-feature': {
      'expiryMinutes': 0,
      'costDollars': 2.00,
      'address': {
        'dollars': '0x046c88317b23dc57F6945Bf4140140f73c8FC80F',
        'ethers': '0x046c88317b23dc57F6945Bf4140140f73c8FC80F',
        'bitcoins': 'tb1qr9d7z0es86sps5f2kefx5grpj4a5yvp4evj80z'
      }
    },
    'subscribed-feature': {
      'expiryMinutes': 30,
      'costDollars': 3.00,
      'address': {
        'dollars': '0x046c88317b23dc57F6945Bf4140140f73c8FC80F',
        'ethers': '0x046c88317b23dc57F6945Bf4140140f73c8FC80F',
        'bitcoins': 'tb1qr9d7z0es86sps5f2kefx5grpj4a5yvp4evj80z'
      }
    }
  }
};