import {
  customElement,
  FASTElement,
  html,
  ref,
  attr,
  observable,
  Observable
} from "@microsoft/fast-element";

import {
  CURRENCY_BY_IMPARTER,
  NETWORKS_BY_IMPARTER,
  Currency,
  IPay2MyAppLogin,
  Imparter,
  Social,
  IPay2MyAppAppsell,
  IPay2MyAppHub,
  IPay2MyAppPendingTransactionEvent,
  IPay2MyAppSkuAuthenticationChangedEvent,
  IPay2MyAppSkuAuthorizationChangedEvent,
  PaymentsInfo,
  NetworkType
} from './definitions';

import oh$ from "ledgers.js";
import w3Css from "../../static/w3.css";

const template = html<Pay2MyAppHub>`<template ${ref('rootElement')}></template>`

@customElement({
  name: "pay2myapp-hub",
  template
})
export class Pay2MyAppHub extends FASTElement implements IPay2MyAppHub {
  @attr({ mode: 'boolean' })
  isTest?: boolean | null = false;

  @attr({ mode: 'boolean' })
  noCache?: boolean | null = false;

  @attr
  apiKey?: string | null;

  @attr
  token?: string | null;

  // payments object
  @observable
  public paymentsInfo: PaymentsInfo = {
    currentCurrency: Currency.unknown,
    currentImparter: Imparter.unknown,
    currentSocial: Social.unknown,

    isOnLedger: {
      "btc-manual": false,
      "eth-web3": false,
      "ohledger-social": false,
      "ohledger-web3": false,
      ohledger: false,
      unknown: false
    },
    wallet: {
      "btc-manual": false,
      "eth-web3": false,
      "ohledger-social": false,
      "ohledger-web3": false,
      ohledger: false,
      unknown: false
    },

    payerAddress: {
      "btc-manual": null,
      "eth-web3": null,
      "ohledger-social": null,
      "ohledger-web3": null,
      ohledger: null,
      unknown: null
    },
    payerPrivateKey: {
      "btc-manual": null,
      "eth-web3": null,
      "ohledger-social": null,
      "ohledger-web3": null,
      ohledger: null,
      unknown: null
    },
    payerSignature: {
      "btc-manual": null,
      "eth-web3": null,
      "ohledger-social": null,
      "ohledger-web3": null,
      ohledger: null,
      unknown: null
    },
    messageToSign: {
      "btc-manual": null,
      "eth-web3": null,
      "ohledger-social": null,
      "ohledger-web3": null,
      ohledger: null,
      unknown: null
    },

    loginElement: null,
    pendingTransaction: <IPay2MyAppPendingTransactionEvent>{ isPending: false, currency: null },

    skuAuthorizations: {},
    skuComponents: {},

    ordinal: 0,

    enabled: false
  };

  // set error if any
  @observable
  public error?: string | null;

  rootElement?: HTMLElement;

  public readonly THIS_IS_OVERHIDE_HUB: boolean = true;

  private allowNetworkType: NetworkType = NetworkType.prod;
  private isWiredUp = false;
  private isSkippingCache = false;
  private ordinal = 1;

  // cache of outstanding results
  private tallyCache: { [key: string]: Promise<{ tally: number | null, asOf: string | null }> } = {};

  connectedCallback() {
    super.connectedCallback();

    this.isWiredUp = true;
    if (this.rootElement?.hasAttribute('isTest')) {
      this.isTestChanged(false, true);
    }
    if (this.rootElement?.hasAttribute('noCache')) {
      this.noCacheChanged(false, true);
    }
    if (this.rootElement?.hasAttribute('apiKey')) {
      this.apiKeyChanged('', this.rootElement.getAttribute('apiKey') || '');
    }
    if (this.rootElement?.hasAttribute('token')) {
      this.tokenChanged('', this.rootElement.getAttribute('token') || '');
    }
    this.initSession().then(() => {
      this.enabledDetection();
      this.initCallbacks();
      this.initNetworks();
      this.pingApplicationState();
    });
  };

  enabledDetection() {
    this.paymentsInfo.enabled = navigator.onLine;
    window.addEventListener('offline', () => { 
      this.paymentsInfo.enabled = false;
      Observable.notify(this, 'paymentsInfo')
     });
    window.addEventListener('online', () => { 
      this.paymentsInfo.enabled = true; 
      Observable.notify(this, 'paymentsInfo')
    });
  }

  public constructor() {
    super();
  }

  public init() {
    this.connectedCallback();
  }

  // @param {string} error -- the error string to set
  public setError = (error: string) => {
    this.error = error;
  }

  // @param {Imparter} imparter - to retrieve for
  // @returns {string} the network name
  public getNetwork = (imparter: Imparter): string => {
    return NETWORKS_BY_IMPARTER[this.allowNetworkType][imparter];
  }

  // @returns {NetworkType} the network type
  public getNetworkType = (): NetworkType => {
    return this.allowNetworkType;
  }

  // Set current imparter and authenticates
  // @param {Imparter} imparter - to set
  // @returns {bool} true if success or cancel, false if some problem
  public setCurrentImparter = async (imparter: Imparter): Promise<boolean> => {
    return this.setCurrentImparterByFn(
      imparter,
      async () => {
        if (!this.isAuthenticated(imparter)) {
          await this.authenticate(imparter);
        }  
      }
    )
  }

  // Set current imparter iff signed message checks out against signature for address: if on ledger
  // @param {Imparter} imparter - to set
  // @param {string|null} message
  // @param {string|null} signature
  // @param {string|null} address - if imparter is from wallet, wallet will be interrogated for addres, but will not be asked to sign
  // @returns {bool} true if success or cancel, false if some problem
  public setCurrentImparterChecked = async (
    imparter: Imparter,
    message: string|null,
    signature: string|null,
    address: string|null
    ): Promise<boolean> => {
    return this.setCurrentImparterByFn(
      imparter,
      async () => {
        if (imparter === Imparter.unknown) return;
        if (oh$.canSetCredentials(imparter)) {
          oh$.setCredentials(imparter, {address});
        }
        await this.isOnLedger(imparter, {message, signature});
      }
    )
  }  

  public setCurrentSocial = async (social: Social) => {
    if (this.paymentsInfo.currentSocial != social) {
      this.paymentsInfo.payerAddress[Imparter.ohledgerSocial] = null;
      this.paymentsInfo.payerSignature[Imparter.ohledgerSocial] = null;
      this.paymentsInfo.messageToSign[Imparter.ohledgerSocial] = null;
      this.paymentsInfo.isOnLedger[Imparter.ohledgerSocial] = false;
      this.paymentsInfo.currentSocial = social;
    }

    await oh$.setCredentials(Imparter.ohledgerSocial, { provider: social, address: this.paymentsInfo.payerAddress[Imparter.ohledgerSocial] });
  }

  // Sets credentials secret key for non-wallet workflow
  // @param {Imparter} imparter - to set 
  // @param {string} new key - to set
  // @returns {Promise<boolean>} -- whether successful
  public setSecretKey = async (imparter: Imparter, newKey: string): Promise<boolean> => {
    try {
      if (imparter === Imparter.unknown) this.error = 'cannot set secret, imparter not set';
      if (!this.paymentsInfo.wallet[imparter]) {
        return await oh$.setCredentials(imparter, { secret: newKey });
      }
    } catch (error) {
    }
    return false;
  }

  // Sets credentials address for non-wallet workflow
  // @param {Imparter} imparter - to set 
  // @param {string} newAddress - to set
  // @returns {Promise<boolean>} -- whether successful
  public setAddress = async (imparter: Imparter, newAddress: string): Promise<boolean> => {
    try {
      if (imparter === Imparter.unknown) this.error = 'cannot set secret, imparter not set';
      if (!this.paymentsInfo.wallet[imparter]) {
        return await oh$.setCredentials(imparter, { address: newAddress });
      }
    } catch (error) {
    }
    return false;
  }

  // Generates new PKI keys for non-wallet workflows.
  // Updates paymentsInfo provided by service.
  // No-op if current currency has a wallet set.
  // @param {Imparter} imparter - to set 
  public generateNewKeys = async (imparter: Imparter) => {
    const oldInfo = { ...this.paymentsInfo };
    try {
      if (imparter === Imparter.unknown) this.error = 'cannot generate new key, imparter not set';
      if (!this.paymentsInfo.wallet[imparter]) {
        await oh$.generateCredentials(imparter, null);
      }
    } catch (error) {
      this.paymentsInfo = { ...oldInfo };
      this.error = `${typeof error == 'object' && 'message' in error ? error.message : error}`;
    }
  }

  // Is current crednetial authenticatd against the current currency's ledger? 
  // @param {Imparter} imparter - to set 
  // @returns {boolean} after checking signature and whether ledger has any transactions (to anyone)
  public isAuthenticated = (imparter: Imparter) => {
    return this.paymentsInfo.isOnLedger[imparter] && !!this.paymentsInfo.payerSignature[imparter];
  }

  // Get tally as per current imparter, to a certain address, within a certain time.
  // @param {string} to - address of recepient
  // @param {number} minutes - number of minutes to look back (since) on the ledger
  // @returns {{amount: number | null, asOf: string | null}} balance in dollars, null if not yet known, and as-of timestamp
  public getTally = async (to: string, tallyMinutes: number | null): Promise<{ tally: number | null, asOf: string | null }> => {
    const currency = this.getCurrentCurrency();
    const imparter = this.getCurrentImparter();
    if (currency === Currency.unknown || imparter === Imparter.unknown) throw `unknown current currency/imparter in getOutstanding`;
    const key = this.getKey(imparter, to, tallyMinutes);
    if (key in this.tallyCache) {
      return this.tallyCache[key];
    }
    this.tallyCache[key] = new Promise<{ tally: number | null, asOf: string | null }>(async (resolve) => {
      const oldInfo = { ...this.paymentsInfo };
      try {
        let tally;
        let asOf;
        const creds = await oh$.getCredentials(imparter);
        if (!creds || !creds.address) {
          resolve({ tally: null, asOf: null });
        };
        if (tallyMinutes) {
          let since = new Date();
          since.setMinutes(since.getMinutes() - tallyMinutes);
          const result = await oh$.getTallyDollars(imparter, { 
            address: to,
            token: this.paymentsInfo.messageToSign[imparter],
            signature: this.paymentsInfo.payerSignature[imparter]  
          }, since);
          tally = result['tally'];
          asOf = result['as-of'];
        } else {
          const result = await oh$.getTallyDollars(imparter, { 
            address: to,
            token: this.paymentsInfo.messageToSign[imparter],
            signature: this.paymentsInfo.payerSignature[imparter]  
          }, null);
          tally = result['tally'];
          asOf = result['as-of'];
        }
        resolve({ tally, asOf });
      } catch (error) {
        this.paymentsInfo = { ...oldInfo };
        this.error = `${typeof error == 'object' && 'message' in error ? error.message : error}`;
        resolve({ tally: null, asOf: null });
      }
    });
    return this.tallyCache[key];
  }

  // Get balance outstanding for authorization as per current currency.
  // @param {number} costInDollars - amount expected to tally (in dollars or ethers)
  // @param {string} to - address of recepient
  // @param {number} minutes - number of minutes to look back (since) on the ledger
  // @returns {{delta: number | null, asOf: string | null}} differnce in dollars, $0 if authorized, null if not yet known, and as-of timestamp
  public getOutstanding = async (costInDollars: number, to: string, tallyMinutes: number | null): Promise<{ delta: number | null, asOf: string | null }> => {
    let { tally, asOf } = await this.getTally(to, tallyMinutes);

    if (!tally) {
      return { delta: null, asOf: null };
    }

    var delta = costInDollars - tally;
    delta = delta < 0 ? 0 : delta;

    return { delta: delta, asOf: asOf };
  }

  // Do the actual topup to authorize
  // @param {number} amountDollars - amount to topup in US dollars, can be 0 to just create a free transaction for getting on ledger
  // @param {} toAddress - to pay, can be null if `amountDollars` is 0.
  // @returns {Promise<boolean>} with status of topup -- successful or not.
  public topUp = async (amountDollars: number, toAddress: string | null): Promise<boolean> => {
    const imparter = this.getCurrentImparter();
    const oldInfo = { ...this.paymentsInfo };
    if (!toAddress && amountDollars > 0) throw `cannot topUp: toAddress null and a non-0 amount`;
    toAddress = !toAddress ? oldInfo.payerAddress[imparter] : toAddress;
    try {
      this.paymentsInfo.pendingTransaction = <IPay2MyAppPendingTransactionEvent>{ isPending: true, currency: this.paymentsInfo.currentCurrency };
      this.$emit('pay2myapp-hub-pending-transaction', this.paymentsInfo.pendingTransaction);
      const amount = Math.ceil(amountDollars == 0 ? amountDollars : await oh$.getFromDollars(imparter, amountDollars));
      const aDayAgo = new Date((new Date()).getTime() - 24 * 60 * 60 * 1000);     // we compare tallies...
      if (amount > 0) {
        var before = await oh$.getTallyDollars(imparter, { 
          address: toAddress,
          token: this.paymentsInfo.messageToSign[imparter],
          signature: this.paymentsInfo.payerSignature[imparter]
        }, aDayAgo);  // ... by taking a sample before
      }
      let options = this.paymentsInfo.payerSignature[imparter] && this.paymentsInfo.messageToSign[imparter] && {
        message: this.paymentsInfo.messageToSign[imparter],
        signature: this.paymentsInfo.payerSignature[imparter],
        isPrivate: true
      };
      const result = await oh$.createTransaction(imparter, amount, toAddress, options);
      if (amount > 0) {
        for (var i = 0; i < 15; i++) {
          let now = await oh$.getTallyDollars(imparter, { 
            address: toAddress,
            token: this.paymentsInfo.messageToSign[imparter],
            signature: this.paymentsInfo.payerSignature[imparter]  
          }, aDayAgo); // ... we take a sample now
          if (now.tally || 0 > before.tally || 0) break;                           // ... and exit out as soon as decentralized
          //     ledger is consistent between the wallet's
          //     node and ledgers.js node
          if (imparter != Imparter.btcManual) {
            await this.delay(5000);                                                // ... else wait 5 seconds
          } else {
            await this.delay(65000);
          }
        }
      }
      this.paymentsInfo.isOnLedger[imparter] = result;
      this.refresh(imparter);
      this.setCurrentImparter(imparter);
      return result;
    } catch (error) {
      this.paymentsInfo = { ...oldInfo };
      this.error = `${typeof error == 'object' && 'message' in error ? error.message : error}`;
      return false;
    } finally {
      this.paymentsInfo.pendingTransaction = <IPay2MyAppPendingTransactionEvent>{ isPending: false, currency: this.paymentsInfo.currentCurrency };
      this.$emit('pay2myapp-hub-pending-transaction', this.paymentsInfo.pendingTransaction);
      this.pingApplicationState();
    }
  }

  // Clear credentials and wallet if problem
  public clear = (imparter: Imparter) => {
    this.refresh(null);
    delete this.paymentsInfo.wallet[imparter];
    this.paymentsInfo.payerAddress[imparter] = null;
    this.paymentsInfo.payerPrivateKey[imparter] = null;
    this.paymentsInfo.messageToSign[imparter] = null;
    this.paymentsInfo.payerSignature[imparter] = null;
    this.paymentsInfo.isOnLedger[imparter] = false;
    this.paymentsInfo.currentImparter = Imparter.unknown;
    this.paymentsInfo.currentCurrency = Currency.unknown;
    this.paymentsInfo.currentSocial = Social.unknown;
    this.paymentsInfo.skuAuthorizations = {};
    sessionStorage.removeItem('paymentsInfo');
    if (imparter == Imparter.ohledgerSocial && !!this.paymentsInfo.currentImparter && this.paymentsInfo.currentImparter != Imparter.unknown) {
      oh$.setCredentials(null);
    }

    const event: IPay2MyAppSkuAuthenticationChangedEvent = <IPay2MyAppSkuAuthenticationChangedEvent>{ imparter: Imparter.unknown, isAuthenticated: false };
    this.$emit("pay2myapp-hub-sku-authentication-changed", event);

    this.pingApplicationState();
  }

  public getInfo = () => this.paymentsInfo;

  // Get URL for imparter
  // @param {Imparter} imparter - to set 
  // @return {string} the URL
  public getUrl = (imparter: Imparter) => {
    return oh$.getOverhideRemunerationAPIUri(imparter);
  }

  public setLoginElement = (element?: IPay2MyAppLogin | null) => {
    this.paymentsInfo.loginElement = element;
    this.pingApplicationState();
  }

  // @param {Imparter} imparter -- which imparter to refresh for or null for all
  public refresh = (imparter: Imparter | null) => {
    if (imparter) {
      let newCache: { [key: string]: Promise<{ tally: number | null, asOf: string | null }> } = {};
      for (const key in this.tallyCache) {
        if (!key.startsWith(imparter)) {
          newCache[key] = this.tallyCache[key];
        }
      }
      this.tallyCache = newCache;
    } else {
      this.tallyCache = {};
    }
    this.pingApplicationState();
  }

  public setSkuAuthorized = (sku: string, authorized: boolean, asOf: string | null | undefined) => {
    if (sku in this.paymentsInfo.skuAuthorizations) {
      if (this.paymentsInfo.skuAuthorizations[sku] == authorized) {
        return;
      }
    }
    this.paymentsInfo.skuAuthorizations[sku] = authorized;
    const event: IPay2MyAppSkuAuthorizationChangedEvent = <IPay2MyAppSkuAuthorizationChangedEvent>{ sku: sku, isAuthorized: authorized, asOf: asOf };
    this.$emit("pay2myapp-hub-sku-authorization-changed", event);
  }

  public isSkuAuthorized = (sku: string): boolean => {
    if (sku in this.paymentsInfo.skuAuthorizations) {
      return this.paymentsInfo.skuAuthorizations[sku];
    }
    return false;
  }

  public setComponentForSku = (sku: string, component: IPay2MyAppAppsell) => {
    if (sku in this.paymentsInfo.skuComponents) {
      console.warn(`sku ${sku} already has a component set, resetting`);
    }

    this.paymentsInfo.skuComponents[sku] = component;
    this.pingApplicationState();
  }

  public getComponentForSku = (sku: string): IPay2MyAppAppsell | null => {
    if (sku in this.paymentsInfo.skuComponents) {
      return this.paymentsInfo.skuComponents[sku];
    }
    return null;
  }

  public logout = (): void => {
    if (this.paymentsInfo.currentImparter == Imparter.ohledgerSocial) {
      oh$.setCredentials(Imparter.ohledgerSocial, null);
    }
  }

  private getKey(imparter: Imparter, to: string, tallyMinutes: number | null): string {
    return `${imparter}_${to}_${tallyMinutes}`;
  }

  // Authenticate for the specific imparter.
  // @param {Imparter} imparter - to set 
  private authenticate = async (imparter: Imparter) => {
    this.refresh(imparter); // reset outstanding cache
    if ((!this.paymentsInfo.payerSignature[imparter]
      || !this.paymentsInfo.messageToSign[imparter])) {
      await this.sign(imparter);
    }
    const options = this.paymentsInfo.payerSignature[imparter] && this.paymentsInfo.messageToSign[imparter] && {
      message: this.paymentsInfo.messageToSign[imparter],
      signature: this.paymentsInfo.payerSignature[imparter]
    };
    await this.isOnLedger(imparter, options);
  }

  private isTestChanged(oldValue: boolean, newValue: boolean) {
    if (!this.isWiredUp) return;
    this.allowNetworkType = newValue ? NetworkType.test : NetworkType.prod;
    this.initNetworks();
  }

  private noCacheChanged(oldValue: boolean, newValue: boolean) {
    this.isSkippingCache = newValue;
  }

  private async apiKeyChanged(oldValue: string, newValue: string) {
    if (!this.isWiredUp) return;
    const token = await this.initToken(newValue);
    if (token) {
      await this.initLib(token);
    }
  }

  private async tokenChanged(oldValue: string, newValue: string) {
    if (!this.isWiredUp) return;
    await this.initLib(newValue);
  }

  // @returns {Currency} 
  private getCurrentCurrency = () => {
    return this.paymentsInfo.currentCurrency;
  }

  // @returns {Imparter} 
  private getCurrentImparter = () => {
    return this.paymentsInfo.currentImparter;
  }

  // Trigger redraw via application state update
  private pingApplicationState = () => {
    this.paymentsInfo = { ...this.paymentsInfo, ordinal: this.ordinal++ };
  }

  // Set current imparter common bits, with passed in fuction doing the setting.
  private setCurrentImparterByFn = async (imparter: Imparter, fn: ()=>{}): Promise<boolean> => {
    const oldInfo = { ...this.paymentsInfo };
    try {
      this.refresh(imparter); // reset outstanding cache
      this.paymentsInfo.currentImparter = imparter;
      this.paymentsInfo.currentCurrency = CURRENCY_BY_IMPARTER[imparter];

      await fn();

      const event: IPay2MyAppSkuAuthenticationChangedEvent = <IPay2MyAppSkuAuthenticationChangedEvent>{ 
        imparter: imparter, 
        from: this.paymentsInfo.payerAddress[imparter],
        message: this.paymentsInfo.messageToSign[imparter],
        signature: this.paymentsInfo.payerSignature[imparter],
        isAuthenticated: this.isAuthenticated(imparter) 
      };
      this.$emit("pay2myapp-hub-sku-authentication-changed", event);

      this.pingApplicationState();
      sessionStorage.setItem('paymentsInfo', JSON.stringify({ ...this.paymentsInfo, skuComponents: {}, loginElement: null }));
      return true;
    }
    catch (e) {
      this.paymentsInfo = { ...oldInfo };
      this.error = e;
      if (e == 'user close') {
        return true; // cancel
      }
      sessionStorage.removeItem('paymentsInfo');
      return false;
    }
  }  

  // Check current credentials for any transactions on current ledger.
  // @param {Imparter} imparter - to set 
  // @param {} options - to leverage
  private isOnLedger = async (imparter: Imparter, options: any = {}) => {
    try {
      this.paymentsInfo.isOnLedger[imparter] = false;
      if (await oh$.isOnLedger(imparter, options)) {
        this.paymentsInfo.isOnLedger[imparter] = true;
        if ('message' in options) this.paymentsInfo.messageToSign[imparter] = options.message;
        if ('signature' in options) this.paymentsInfo.payerSignature[imparter] = options.signature;
      }
    } catch (error) {
      throw `${typeof error == 'object' && 'message' in error ? error.message : error}`;
    }
  }

  // Sign a challenge with current credentials and set to the payments info.
  private sign = async (imparter: Imparter) => {
    try {
      const challenge = this.getChallenge();
      var signature = await oh$.sign(imparter, challenge);
      if (imparter == Imparter.ohledgerSocial) {
        this.setCredentials(imparter, oh$.getCredentials(imparter).address, null);
      }
      this.setSignature(imparter, challenge, signature);
    } catch (error) {
      this.setSignature(imparter, null, null);
      throw `${typeof error == 'object' && 'message' in error ? error.message : error}`;
    }
  }

  // Set wallet
  // @param {Imparter} imparter - to set 
  // @param {boolean} value - to set
  private setWallet = (imparter: Imparter, value: boolean) => {
    this.paymentsInfo.wallet[imparter] = value;
    this.pingApplicationState();
  }

  // Set signature
  // @param {Imparter} imparter - to set 
  // @param {string} messageToSign - message to sign
  // @param {string} payerSignature - signed message
  private setSignature = (imparter: Imparter, messageToSign: string | null, payerSignature: string | null) => {
    this.paymentsInfo.messageToSign[imparter] = messageToSign;
    this.paymentsInfo.payerSignature[imparter] = payerSignature;
    this.pingApplicationState();
  }

  // Set credentials
  // @param {Imparter} imparter - to set 
  // @param {string} payerAddress - (out only) payer's public address as set by service
  // @param {string} payerPrivateKey - payer's private key (receipt code) iff not using wallet, null if using wallet
  private setCredentials = async (imparter: Imparter, payerAddress: string, payerPrivateKey: string | null) => {
    this.paymentsInfo.payerAddress[imparter] = payerAddress;
    this.paymentsInfo.payerPrivateKey[imparter] = payerPrivateKey;
    this.paymentsInfo.messageToSign[imparter] = null;
    this.paymentsInfo.payerSignature[imparter] = null;
    this.pingApplicationState();
  }

  /**
   * Retrieve API access token
   * 
   * @returns {string} the token.
   */
  private getToken = async (): Promise<string | null> => {
    const tokenUrl = `https://token.overhide.io/token`;
    const url = `${tokenUrl}?apikey=${this.apiKey}`;

    return fetch(url, {
      method: 'GET'
    }).then(result => {
      if (result.status === 200) {
        return result.text();
      } else {
        throw (JSON.stringify({ url: url, status: result.status, error: result.statusText }));
      }
    }).then(token => {
      return token;
    }).catch(e => {
      return null;
    });
  }

  // sets this.token
  // @param {string} apiKey - the API key to retrieve token for.
  //
  // see https://token.overhide.io/swagger.html
  private initToken = async (apiKey: string): Promise<string | null> => {
    if (!this.apiKey) return null;
    this.token = await this.getToken();
    return this.token;
  }

  // initializes oh$ library
  // @param {string} token - the token for overhide.
  //
  // see https://token.overhide.io/swagger.html
  private initLib = async (token: string) => {
    if (!token) return;
    const that = this;
    (async () => {
      try {
        await oh$.enable(token);
      } catch (e) {
        console.error(e);
      }
    })();
  }

  private initNetworks = () => {
    oh$.setNetwork('ohledger', { currency: 'USD', mode: this.allowNetworkType == NetworkType.test ? 'test' : 'prod' });
    oh$.setNetwork('ohledger-web3', { currency: 'USD', mode: this.allowNetworkType == NetworkType.test ? 'test' : 'prod' });
    oh$.setNetwork('ohledger-social', { currency: 'USD', mode: this.allowNetworkType == NetworkType.test ? 'test' : 'prod' });
    oh$.setNetwork('btc-manual', { mode: this.allowNetworkType == NetworkType.test ? 'test' : 'prod' });
  }

  private initSession = async () => {
    if (this.noCache) {
      console.log(`no cache enabled, not loading session storage`);
      return;
    }
    const fromStorage = window.sessionStorage.getItem('paymentsInfo');
    if (fromStorage) {
      this.paymentsInfo = JSON.parse(fromStorage);
      if (this.paymentsInfo.currentImparter) {
        switch (this.paymentsInfo.currentImparter) {
          case Imparter.ohledgerSocial:
            if (this.paymentsInfo.currentSocial) await this.setCurrentSocial(this.paymentsInfo.currentSocial);
            break;
          case Imparter.ohledger:
            const key = this.paymentsInfo.payerPrivateKey[Imparter.ohledger];
            if (key) {
              await this.setSecretKey(Imparter.ohledger, key);
            } else {
              const address = this.paymentsInfo.payerAddress[Imparter.ohledger];
              if (address) await this.setAddress(Imparter.ohledger, address)
            }
            break;
          case Imparter.ohledgerWeb3:
          case Imparter.ethWeb3:
          case Imparter.btcManual:
            const address = this.paymentsInfo.payerAddress[this.paymentsInfo.currentImparter];
            if (address) await this.setAddress(this.paymentsInfo.currentImparter, address);
            break;
        }
        if (!this.paymentsInfo.payerAddress[this.paymentsInfo.currentImparter]) {
          this.paymentsInfo.messageToSign[this.paymentsInfo.currentImparter] = null;
          this.paymentsInfo.payerSignature[this.paymentsInfo.currentImparter] = null;
        }
      }
    }
  }

  // Initialize oh$ listeners.
  private initCallbacks = () => {
    // Determine if ethers should be enabled based on uri from wallet (versus admin)
    // Ethers only enabled if wallet, so do everything in 'onWalletChange'
    oh$.addEventListener('onWalletChange', async (e: any) => {
      const network = await oh$.getNetwork(e.imparterTag);
      const credentials = await oh$.getCredentials(e.imparterTag);
      const imparter: Imparter = e.imparterTag;
      switch (imparter) {
        case Imparter.ethWeb3:
          if (e.isPresent) {
            if (NETWORKS_BY_IMPARTER[this.allowNetworkType][imparter] == network.name) {
              this.setWallet(imparter, e.isPresent);
              await this.setCredentials(imparter, credentials.address, null);
            } else {
              // wrong network
              this.clear(imparter);
              this.error = `Network misconfiguration: (expected:${NETWORKS_BY_IMPARTER[this.allowNetworkType][imparter]}) (seen:${network.name})`;
              return;
            }
          } else {
            // no wallet no ether payments
            this.clear(imparter);
          }
          // dollars always available, ethers enabled when network detected below  
          break;
        case 'ohledger-web3':
          this.setWallet(imparter, e.isPresent);
          await this.setCredentials(imparter, credentials.address, null);
          console.log(`pay2myapp-ledger wallet set for network ${network.currency}:${network.mode}`); // no network misconfigs for ohledger as explicitly set
          break;
        default:
      }
    });

    // Determine if dollars should be enabled.  Since we enable dollars test network at end below, we know this will trigger..
    // No wallet for dollars in this example.
    oh$.addEventListener('onNetworkChange', async (e: any) => {
      const imparter: Imparter = e.imparterTag;
      switch (imparter) {
        case Imparter.ethWeb3:
        case Imparter.btcManual:
          if (e && e.name && NETWORKS_BY_IMPARTER[this.allowNetworkType][imparter] !== e.name) {
            // wrong network
            this.clear(imparter);
            this.error = `Network misconfiguration: (expected:${NETWORKS_BY_IMPARTER[this.allowNetworkType][imparter]}) (seen:${e.name})`;
            return;
          }
          break;
        case Imparter.ohledger:
        case Imparter.ohledgerWeb3:
        case Imparter.ohledgerSocial:
          if ('currency' in e
            && 'mode' in e
            && `${e.currency}:${e.mode}` == NETWORKS_BY_IMPARTER[this.allowNetworkType][imparter]) {
            break;
          }
          // wrong network
          this.clear(imparter);
          this.error = `pay2myapp-ledger network misconfig: (expected:${NETWORKS_BY_IMPARTER[this.allowNetworkType][imparter]}) (seen: ${e.currency}:${e.mode})`;
          return;
        default:
      }
    });

    // Update current payer
    oh$.addEventListener('onCredentialsUpdate', async (e: any) => {
      const imparter: Imparter = e.imparterTag;
      // don't update if wallet not set/unset:  perhaps network error above.
      if (imparter === Imparter.ethWeb3 && !this.paymentsInfo.wallet[imparter]) return;
      if (imparter === Imparter.ohledgerWeb3 && !this.paymentsInfo.wallet[imparter]) return;

      await this.setCredentials(imparter, e.address, 'secret' in e ? e.secret : null);
    });

    oh$.addEventListener('onWalletChange', async (e: any) => {
      this.refresh(e.imparterTag as Imparter);
      this.pingApplicationState();
    });
  }

  /**
   * @returns {string} a challenge
   */
  public getChallenge(): string {
    if (!this.token) throw `token not initialized`;
    return this.token;
  }

  /**
   * @param {number} t - millis to delay
   * @returns {Promise} completing when delay is done
   */
  public delay(t: number): Promise<any> {
    return new Promise(resolve => setTimeout(resolve.bind(null), t));
  };
}
