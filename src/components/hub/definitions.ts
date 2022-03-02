// Map of oh$ imparter tags to allowed networks
//
// see https://overhide.github.io/ledgers.js/docs/ledgers.js-rendered-docs/index.html#getimpartertags

export enum NetworkType {
  test = 'test',
  prod = 'prod'
}

export enum Currency {
  unknown = 'unknown',
  dollars = 'dollars',
  ethers = 'ethers',
  bitcoins = 'bitcoins'
}

export enum Imparter {
  unknown = 'unknown',
  ohledger = 'ohledger',
  ohledgerWeb3 = 'ohledger-web3',
  ohledgerSocial = 'ohledger-social',
  ethWeb3 = 'eth-web3',
  btcManual = 'btc-manual'
}

export enum Social {
  unknown = 'unknown',
  microsoft = 'microsoft',
  google = 'google'
}

export const CURRENCY_BY_IMPARTER: {[what in Imparter]: Currency} = {
  'eth-web3': Currency.ethers,
  'ohledger': Currency.dollars,
  'ohledger-web3': Currency.dollars,
  'ohledger-social': Currency.dollars,
  'btc-manual': Currency.bitcoins,
  unknown: Currency.unknown
};

export const NETWORKS_BY_IMPARTER: {[which in NetworkType]: {[what in Imparter]: string}} = {
  'test': {
    'eth-web3': 'rinkeby',
    'ohledger': 'USD:test',
    'ohledger-web3': 'USD:test',
    'ohledger-social': 'USD:test',
    'btc-manual': 'test',
    unknown: ''
  },
  'prod': {
    'eth-web3': 'main',
    'ohledger': 'USD:prod',
    'ohledger-web3': 'USD:prod',
    'ohledger-social': 'USD:prod',
    'btc-manual': 'prod',
    unknown: ''
  }
};

// The structure shared by the hub to all the components in the system.
export interface PaymentsInfo {
  wallet: {[which in Imparter]: boolean},   // keyed by (currentImparter || defaultImparter); informs of currently used wallet
  isOnLedger: {[which in Imparter]: boolean}, // keyed by (currentImparter || defaultImparter); informs if currently used credentials are on ledger

  payerAddress: {[which in Imparter]: string | null},            // (out only) payer's public address as set by service
  payerPrivateKey: {[which in Imparter]: string | null},         // payer's private key (receipt code) iff not using wallet, null if using wallet
  payerSignature: {[which in Imparter]: string | null},          // signed `messageToSign` by payer
  messageToSign: {[which in Imparter]: string | null},           // message to sign into `payerSignature`

  currentImparter: Imparter,                // chosen payment imparter
  currentCurrency: Currency,                // chosen payment currency, either 'dollars', 'ethers', or null
  currentSocial: Social,                    // chosen social provider
  ordinal: number,                          // ordinal of refresh

  loginElement?: IPay2MyAppLogin | null,                     // the login element
  pendingTransaction: IPay2MyAppPendingTransactionEvent,     // the currently pending transaction, if any (see flag inside)

  skuAuthorizations: {[sku: string]: boolean}               // state of sku authorizations
  skuComponents: {[sku: string]: IPay2MyAppAppsell}          // component per sku
}

/**
 * Event fired by pay2myapp-appsell as a custom event: "pay2myapp-appsell-sku-clicked"
 * 
 * The event fired by an pay2myapp-appsell component when an appsell 
 * SKU deemed authorized by overhide is clicked by the user.
 * 
 * Usually safest to route state-changes in response to this
 * event via the back-end, and validate authorizations.
 * 
 * All necessary information to validate is provided in this
 * event.
 * 
 * Passing the `asOf` timestamp to your back-end is an important optimization.  The overhide 
 * services already checked these transactions as part of this front-end work.  The `asOf` timestamp
 * ensures we re-load these resutls from cache and do not get rate-limited in the back-end.
 * 
 * The provided `message` is the overhide token retrieved from the overhide cluster.  The provided
 * `signature` is this token signed by `from`.  These can be passed to a back-end to call the
 * `get-transactions` endpoint of overhide remuneration API as an Authorization header (`Bearer ${token}`)
 * and `signature` query param.  Where required.
 */
 export interface IPay2MyAppSkuClickedEvent {
  sku: string,
  message: string,
  signature: string,
  from: string,
  to: string,
  currency: Currency,
  imparter: Imparter,
  isTest: boolean,
  asOf: string
}

/**
 * Event fired by pay2myapp-appsell as a custom event: "pay2myapp-appsell-topup-outstanding"
 * 
 * An event fired by an pay2myapp-appsell component when
 * there was an authorization attempt but insufficient funds
 * to authorize. 
 * 
 * This even contains the outstanind topup funds required.
 */
export interface IPay2MyAppSkuTopupOutstandingEvent {
  sku: string,
  topup: number
}

/**
 * Event fired by pay2myapp-hub as a custom event: "pay2myapp-hub-sku-authentication-changed"
 * 
 * Indicated a change in authentication status.
 * 
 * The `imparter` for which the authentication is changed is signaled.
 */
 export interface IPay2MyAppSkuAuthenticationChangedEvent {
  message: string,
  signature: string,
  from: string,
  imparter: Imparter,
  isAuthenticated: boolean;
}

/**
 * Event fired by pay2myapp-hub as a custom event: "pay2myapp-hub-sku-authorization-changed"
 * 
 * Indicated a change in authorization status.
 */
export interface IPay2MyAppSkuAuthorizationChangedEvent {
  sku: string,
  isAuthorized: boolean;
}

/**
 * Event fired by pay2myapp-hub as a custom event: "pay2myapp-hub-pending-transaction"
 * 
 * Fired when we have a pending transaction.  We're waiting for a transaction to finish.  
 * 
 * This should be useful for spinners on custom pay2myapp-appsell components.
 * 
 * All pay2myapp-appsell components should spin when a transaction is pending.
 */
export interface IPay2MyAppPendingTransactionEvent {
  isPending: boolean;
  currency: string | null;
}

// Represents any of the pay2myapp-appsell components.
export interface IPay2MyAppAppsell {
  // Set the hub against the login component.
  // An alternative to the `hubId` attribute on the component
  // @param {IPay2MyAppHub} hub -- the hub to set
  setHub(hub: IPay2MyAppHub): void;
  
  // Programatically 'click' the appsell widget.
  //
  // Will result in the login modal is not logged in.
  //
  // If logged in and insufficient funds to authorize, will result in the 
  // IPay2MyAppSkuTopupOutstandingEvent.
  //
  // If authorized, will result in the IPay2MyAppSkuClickedEvent.
  click(): void;
}

// Represents the one login component sitting in your DOM ready to be 
// displayed at fixed coordiantes as an overlay.
//
// Reference available from the PaymentsInfo::loginElement.
//
// Emits "pay2myapp-login-open" custom event when modal open.
//
// Emits "pay2myapp-login-close" custom event when modal closed.
export interface IPay2MyAppLogin {
  // Set the hub against the login component.
  // An alternative to the `hubId` attribute on the component
  // @param {IPay2MyAppHub} hub -- the hub to set
  setHub(hub: IPay2MyAppHub): void;

  // Close the login modal
  //
  // Emits "pay2myapp-login-close" custom event.
  close(): void;

  // Open the login modal
  //
  // Emits "pay2myapp-login-open" custom event.
  //
  // @returns {Promise} to await until closed.  `true` if authenticated, else `false` if user-closed.
  open(): Promise<boolean>;
}

// Represents the pay2myapp-status component.
export interface IPay2MyAppStatus {
  // Set the hub against the login component.
  // An alternative to the `hubId` attribute on the component
  // @param {IPay2MyAppHub} hub -- the hub to set
  setHub(hub: IPay2MyAppHub): void;
}

// Represents the one non-visible hub component that controls all the activity.  
// This doesn't need to be in the dom, but the same hub must be programatically
// connected to all the components.
//
// When hooking up using DOM, the element takes three attributes:
//
// - isTest :: whether testnets ledgers should be interrogated
// - apiKey :: your API key to let the component retrieve token (less bad-actor proof) 
// - token :: the token retrieved from your back-end (more bad-actor proof)
//
// 'apiKey' and 'token' are either-or:  if you specify the 'apiKey' then the component
// will retrieve the token, but that means you 'apiKey' sits in browser-code.
//
// For 'apiKey' and 'token' see https://token.overhide.io/swagger.html.
export interface IPay2MyAppHub {
  // Initialize this hub explitily when not connecting to DOM.
  //
  // Call this after the `token` or `apiKey` attributes are set, `isTest` if on testnet.
  init: () => void;

  // @param {Imparter} imparter - to retrieve for
  // @returns {string} the network name
  getNetwork: (imparter: Imparter) => string;

  // @returns {NetworkType} the network type
  getNetworkType: () => NetworkType;

  // @param {string} error -- the error string to set
  setError: (error: string) => void,

  // Sets credentials secret key for non-wallet workflow
  // @param {Imparter} imparter - to set 
  // @param {string} new key - to set
  // @returns {Promise<boolean>} -- whether successful
  setSecretKey: (imparter: Imparter, newKey: string) => Promise<boolean>,

  // Sets credentials address for non-wallet workflow
  // @param {Imparter} imparter - to set 
  // @param {string} newAddress - to set
  // @returns {Promise<boolean>} -- whether successful
  setAddress: (imparter: Imparter, newAddress: string) => Promise<boolean>,

  // Generates new PKI keys for non-wallet workflows.
  // Updates paymentsInfo provided by service.
  // No-op if current currency has a wallet set.
  // @param {Imparter} imparter - to set 
  generateNewKeys: (imparter: Imparter) => void,

  // Set current imparter and authenticates
  // @param {Imparter} imparter - to set
  // @returns {bool} true if success or cancel, false if some problem
  setCurrentImparter: (imparter: Imparter) => Promise<boolean>,

  // Set social provider if any
  // @param {Social} social provider to set
  setCurrentSocial: (social: Social) => void,

  // Is current crednetial authenticatd against the current currency's ledger? 
  // @param {Imparter} imparter - to set 
  // @returns {boolean} after checking signature and whether ledger has any transactions (to anyone)
  isAuthenticated: (impater: Imparter) => boolean,

  // Get tally as per current imparter, to a certain address, within a certain time.
  // @param {string} to - address of recepient
  // @param {number} minutes - number of minutes to look back (since) on the ledger
  // @returns {{amount: number | null, asOf: string | null}} balance in dollars, null if not yet known, and as-of timestamp
  getTally: (to: string, tallyMinutes: number | null) => Promise<{tally: number | null, asOf: string | null}>,

  // Get balance outstanding for authorization as per current currency.
  // @param {number} costInDollars - amount expected to tally (in dollars or ethers)
  // @param {string} to - address of recepient
  // @param {number} minutes - number of minutes to look back (since) on the ledger
  // @returns {{delta: number | null, asOf: string | null}} differnce in dollars, $0 if authorized, null if not yet known, and as-of timestamp
  getOutstanding: (costInDollars: number, to: string, tallyMinutes: number | null) => Promise<{delta: number | null, asOf: string | null}>,

  // Do the actual topup to authorize
  // @param {number} amountDollars - amount to topup in US dollars, can be 0 to just create a free transaction for getting on ledger
  // @param {string} toAddress - to pay, can be null if amountDollars is 0
  // @returns {Promise<boolean>} with status of topup -- successful or not.
  topUp: (amountDollars: number, toAddress: string | null) => Promise<boolean>,

  // Get URL for imparter
  // @param {Imparter} imparter - to set 
  // @return {string} the URL
  getUrl: (impater: Imparter) => string;

  // Clear and log-out of the provided imparter.
  // @param {Imparter} imparter - to set 
  clear: (imparter: Imparter) => void;

  // Get the current info
  // @returns {PaymentsInfo} -- the current info
  getInfo: () => PaymentsInfo;

  // Sets the login element
  // @param {HTMLElement} element -- the login element
  setLoginElement: (element?: IPay2MyAppLogin | null) => void;

  // Refreshes topup cache to re-fetch new values upon transactions.
    // @param {Imparter} imparter -- which imparter to refresh for
  refresh: (imparter: Imparter | null) => void;

  // Sets the SKU as authorized
  //
  // Fires "pay2myapp-hub-sku-authorization-changed" with IPay2MyAppSkuAuthorizationChangedEvent payload if the authorization 
  // state has changed for this sku.
  //
  // @param {string} sku -- to set
  // @param {boolean} authorized -- authorized or not?
  setSkuAuthorized: (sku: string, authorized: boolean) => void;

  // Is the SKU authorized?
  //
  // @param {string} sku -- to check
  isSkuAuthorized: (sku: string) => boolean;

  // Sets the component for a SKU
  //
  // @param {string} sku -- to set
  // @param {IPay2MyAppAppsell} component -- to set
  setComponentForSku: (sku: string, component: IPay2MyAppAppsell) => void;

  // @param {string} sku -- to check
  // @returns {IPay2MyAppAppsell} the component, if any
  getComponentForSku: (sku: string) => IPay2MyAppAppsell | null;

  // Logout of the current impater, if possible.
  logout: () => void;
}