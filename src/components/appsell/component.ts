import {
  customElement,
  FASTElement,
  html,
  css,
  attr,
  observable,
  Observable,
  ref,
  slotted,
  when
} from "@microsoft/fast-element";

import {
  Imparter,
  IPay2MyAppAppsell,
  IPay2MyAppSkuClickedEvent,
  IPay2MyAppSkuTopupOutstandingEvent,
  IPay2MyAppLogin,
  IPay2MyAppHub,
  NetworkType,
  PaymentsInfo,
  Social
} from '../hub/definitions';
import {Mutex} from 'async-mutex';
 
import w3Css from "../../static/w3.css";
import loadingCss from "../../static/loading.css";

const template = html<Pay2MyAppSell>`
  <template ${ref('rootElement')}>
    <div class="panel ${e => e.orientation} ${e => e.isEnabled ? '' : 'w3-disabled'}">
      ${when(e => e.isAuthorized, html<Pay2MyAppSell>`
        <slot name="authorized-header" class="${e => e.isClickable() ? '' : 'noclick'}"  @click="${e => e.isClickable() && e.click()}">
        </slot>
      `)}
      ${when(e => !e.isAuthorized, html<Pay2MyAppSell>`
        <slot name="unauthorized-header" class="${e => e.isClickable() ? '' : 'noclick'}"  @click="${e => e.isClickable() && e.click()}">
        </slot>
      `)}
      ${when(e => e.isAuthorized, html<Pay2MyAppSell>`
        <slot name="authorized-button" ${slotted('authorizedButton')} class="${e => e.loading ? 'loading' : ''} ${e => e.isClickable() ? '' : 'noclick'}"  @click="${e => e.isClickable() && e.click()}">
          <div class="button w3-button w3-dark-grey ${e => e.isClickable() ? '' : 'disabled'}">
            <div class="button-content ${e => e.loading ? 'dim' : ''}">${e => e.getAuthButtonContent()}</div>
          </div>
        </slot>
      `)}
      ${when(e => !e.isAuthorized, html<Pay2MyAppSell>`
        <slot name="unauthorized-button" ${slotted('unauthorizedButton')} class="${e => e.loading ? 'loading' : ''} ${e => e.isClickable() ? '' : 'noclick'}"  @click="${e => e.isClickable() && e.click()}">
          <div class="button w3-button w3-dark-grey ${e => e.isClickable() ? '' : 'disabled'}">
            <div class="button-content ${e => e.loading ? 'dim' : ''}">${e => e.getUnauthButtonContent()}</div>
          </div>
        </slot>
      `)}
      ${when(e => e.isAuthorized, html<Pay2MyAppSell>`
        <slot name="authorized-footer" class="${e => e.isClickable() ? '' : 'noclick'}"  @click="${e => e.isClickable() && e.click()}"></slot>
      `)}
      ${when(e => !e.isAuthorized, html<Pay2MyAppSell>`
        <slot name="unauthorized-footer" class="${e => e.isClickable() ? '' : 'noclick'}"  @click="${e => e.isClickable() && e.click()}"></slot>
      `)}
    </div>
  </template>
`;

const styles = css`
${w3Css}
${loadingCss}

  :host {
    display: flex;
    align-content: stretch;
    justify-content: stretch;
    margin: auto;
    contain: content;
    text-align: center;    
    width: 100%;
    height: 100%;
  }

  .panel {
    flex-basis: 100%;
    flex-grow: 2;      
    display: flex;
    align-items: stretch;
    justify-content: center;
  }

  .panel.horizontal {
    flex-direction: row;
  }

  .panel.vertical {
    flex-direction: column;
  }

  .button.disabled {
    cursor: inherit;
    opacity: .5;
  }

  .button {
    cursor: pointer !important;
    flex-basis: 100%;
    flex-grow: 2;     
    width: 100%;
    height: 100%;
    white-space: inherit;
    margin: 0px;
    padding: 0px;
  }

  .button-content {
    padding: 1em;
  }

  .dim {
    opacity: .2;
  }

  .noclick {
    cursor: inherit;
    pointer-events: none;
  }
`;

export enum Orientation {
  horizontal = 'horizontal',
  vertical = 'vertical'
}

@customElement({
  name: "pay2myapp-appsell",
  template,
  styles,
})
export class Pay2MyAppSell extends FASTElement implements IPay2MyAppAppsell {
  @attr 
  hubId?: string;

  @attr
  orientation?: Orientation | null = Orientation.vertical;

  @attr
  sku?: string | null;

  @attr
  priceDollars?: string | null;

  // If this attribute is specified, the component will act solely as a login button (no payments).
  //
  // All other attribtues except for hubId and orientation are ignored.
  //
  // When customizing this component as a login button, only the unauthorized slots need modifying:
  // - unauthorized-header
  // - unauthorized-button
  // - unauthorized-footer
  @attr
  loginMessage?: string | null;

  // If set, login modal always pops up when clicked:  always allows re-auth.  Useful when no explicit logout provided in the app.
  @attr({ mode: 'boolean' })
  alwaysLogin: boolean = false;

  // String to show when component detects fully authorized state.
  @attr
  authorizedMessage: string = 'overwrite authorizedMessage attribute';

  // Template String to show when component detects unauthorized state:  top-up amount is replaced 
  // at the ${topup} placeholder.
  @attr
  unauthorizedTemplate: string = ' overwrite unauthorizedTemplate attribute';

  @attr({ mode: 'boolean' })
  inhibitLogin: boolean = false;

  @attr
  bitcoinAddress?: string | null;

  @attr
  ethereumAddress?: string | null;

  @attr
  overhideAddress?: string | null;

  @attr
  withinMinutes?: string | null;

  @observable
  topupDollars?: number | null;

  // Flags whether this sku is authorized.
  @observable
  public isAuthorized?: boolean | null;

  @observable
  public isEnabled?: boolean | null;

  @observable
  asOf?: string | null;

  @observable 
  authorizedButton?: Node[];

  @observable 
  unauthorizedButton?: Node[];  

  @observable
  loading: boolean = false;

  rootElement?: HTMLElement;
  hub?: IPay2MyAppHub | null; 
  currentImparter?: Imparter | null;
  signature?: string | null;
  loginElement?: IPay2MyAppLogin | null;
  isLogedIn: boolean = false
  lastInfo?: PaymentsInfo | null;
  isInited: boolean = false;
  mutex = new Mutex();

  public constructor() {
    super(); 
  }

  public setHub(hub: any) {
    this.hub = hub;
    const notifier = Observable.getNotifier(hub);
    const that = this;
    const handler = {
      handleChange(source: any, propertyName: string) {
        switch (propertyName) {
          case 'paymentsInfo':
            that.paymentInfoChanged(source.paymentsInfo);
            break;
        } 
      }
    }
    
    notifier.subscribe(handler, 'paymentsInfo');

    if (this.sku) {
      this.hub?.setComponentForSku(this.sku, this);
    }    

    if (hub.getInfo()) {
      this.paymentInfoChanged(hub.getInfo());
    }
  }

  public async click(): Promise<void> {
    if (this.loginElement && (this.loginMessage || this.alwaysLogin || (!this.inhibitLogin && !this.isLogedIn))) {
      if (!await this.loginElement.open()) return;
    }

    if (this.loginMessage) {
      this.isAuthorized = await this.authorize();
      return; // this is just a login button, no further actions.
    }

    if (this.isLogedIn && !this.isAuthorized) {
      if (this.topupDollars == undefined) {
        console.log(`in click(): sku:${this.sku} topup dollars not available`);
        return;
      }
      this.isAuthorized = await this.authorize();
    }

    if (!this.isLogedIn || !this.isAuthorized) {
      return;
    }

    if (!this.lastInfo) {
      console.log(`in click(): sku:${this.sku} no lastInfo`);
      return;
    }

    if (!this.currentImparter || this.currentImparter == Imparter.unknown) {
      console.log(`in click(): sku:${this.sku} current imparter not set`);
      return;
    }

    if (!this.hub) {
      console.log(`in click(): sku:${this.sku} hub not set`);
      return;
    }

    const event: IPay2MyAppSkuClickedEvent = <IPay2MyAppSkuClickedEvent> {
      sku: this.sku,
      topup: this.topupDollars,
      currency: this.lastInfo.currentCurrency,
      imparter: this.currentImparter,
      from: this.lastInfo.payerAddress[this.currentImparter],
      isTest: this.hub?.getNetworkType() == NetworkType.test,
      message: this.lastInfo.messageToSign[this.currentImparter],
      signature: this.lastInfo.payerSignature[this.currentImparter],
      to: this.getToAddress(),
      asOf: this.asOf,
      priceDollars: this.priceDollars ? this.priceDollars : '0',
      withinMinutes: this.withinMinutes ? this.withinMinutes : '0'
    };
    this.$emit(`pay2myapp-appsell-sku-clicked`, event);
  }

  hubIdChanged(oldValue: string, newValue: string) {
    const el = document.querySelector(`#${this.hubId}`);
    if (!el) {
      console.log(`WARNING: pay2myapp-appsell configured for pay2myapp-hub with ID ${newValue} but no element in DOM with this ID.`);
      return;
    }
    this.setHub(el);
  }

  connectedCallback() {
    super.connectedCallback();
    
    this.init();
    this.validate();
    this.wireUpButtonContent();
  };

  init() {
    this.isInited = true;

    if (!this.hub && this.rootElement?.hasAttribute('hubId')) {
      this.hubId = this.rootElement.getAttribute('hubId') || undefined;
    }

    if (!this.orientation && this.rootElement?.hasAttribute('orientation')) {
      this.orientation = this.rootElement.getAttribute('orientation') as Orientation;
    }

    if (!this.sku && this.rootElement?.hasAttribute('sku')) {
      this.sku = this.rootElement.getAttribute('sku');
    }

    if (!this.priceDollars && this.rootElement?.hasAttribute('priceDollars')) {
      this.priceDollars = this.rootElement.getAttribute('priceDollars');
    }

    if (!this.loginMessage && this.rootElement?.hasAttribute('loginMessage')) {
      this.loginMessage = this.rootElement.getAttribute('loginMessage');
    }

    if (!this.alwaysLogin && this.rootElement?.hasAttribute('alwaysLogin')) {
      this.alwaysLogin = true;
    } 

    if (!this.inhibitLogin && this.rootElement?.hasAttribute('inhibitLogin')) {
      this.inhibitLogin = !!this.rootElement.getAttribute('inhibitLogin');
    }

    if (!this.bitcoinAddress && this.rootElement?.hasAttribute('bitcoinAddress')) {
      this.bitcoinAddress = this.rootElement.getAttribute('bitcoinAddress');
    }
    
    if (!this.ethereumAddress && this.rootElement?.hasAttribute('ethereumAddress')) {
      this.ethereumAddress = this.rootElement.getAttribute('ethereumAddress');
    }
    
    if (!this.overhideAddress && this.rootElement?.hasAttribute('overhideAddress')) {
      this.overhideAddress = this.rootElement.getAttribute('overhideAddress');
    }

    if (!this.withinMinutes && this.rootElement?.hasAttribute('withinMinutes')) {
      this.withinMinutes = this.rootElement.getAttribute('withinMinutes');
    }

    if (this.lastInfo) this.paymentInfoChanged(this.lastInfo);
  }

  async paymentInfoChanged(info: PaymentsInfo): Promise<void> {
    await this.mutex.runExclusive(async () => {
      this.lastInfo = info;
      this.currentImparter = info.currentImparter;
      this.loginElement = info.loginElement;
      this.isLogedIn = !!info.currentImparter && !!info.payerSignature[info.currentImparter];
      this.signature = info.payerSignature[info.currentImparter];
      this.isEnabled = info.enabled;
  
      if (!this.isInited) return;
  
      this.validate();
  
      this.isAuthorized = false;
      this.topupDollars = parseFloat(this.priceDollars || "0");
      if (!this.loginMessage && this.currentImparter && this.currentImparter != Imparter.unknown) {
        try {
          this.loading = true;
          this.isAuthorized = await this.determineAuthorized();
        } catch (e) {
        } finally {
          this.loading = false;
        }
      }
      if (this.hub && this.sku) {
        this.hub?.setSkuAuthorized(this.sku, this.isAuthorized, this.asOf);
      }
    });
  }

  toDollars(what?: number | null): string {
    return (Math.round((what || 0) * 100) / 100).toFixed(2);
  }

  authorizedButtonChanged(oldValue: string, newValue: string) {
    this.wireUpButtonContent();
  }

  unauthorizedButtonChanged(oldValue: string, newValue: string) {
    this.wireUpButtonContent();
  }

  authorizedMessageChanged(oldValue: string, newValue: string) {
    this.authorizedMessage = newValue;
    this.wireUpButtonContent();
  }

  unauthorizedTemplateChanged(oldValue: string, newValue: string) {
    this.unauthorizedTemplate = newValue;
    this.wireUpButtonContent();
  }

  skuChanged(oldValue: string, newValue: string) {
    this.sku = newValue;
    if (this.hub) {
      this.hub.refresh(null);
    }
  }
  
  priceDollarsChanged(oldValue: string, newValue: string) {
    this.priceDollars = newValue;
    this.topupDollars = parseFloat(newValue);
    if (this.hub) {
      this.hub.refresh(null);
    }
  }

  validate() {
    if (!this.hub) {
      console.warn(`hub not setup on pay2myapp-appsell component with sku ${this.sku}`);
      return;
    }
    if (this.loginMessage) {
      return; // no other validations.
    }
    if (!this.sku) {
      console.error(`pay2myapp-appsell component not provided a sku`);
      return;
    }
    if (!this.priceDollars) {
      console.error(`pay2myapp-appsell component with sku ${this.sku} not provided a priceDollars`);
      return;
    }
    if (!!this.withinMinutes) {
      try {
        parseInt(this.withinMinutes);
      } catch (e) {
        console.error(`pay2myapp-appsell component with sku ${this.sku} has non-number withinMinutes: ${this.withinMinutes}`);
        return;          
      }
    }
  }

  wireUpButtonContent() {
    const authButton: Node | null = this.authorizedButton && this.authorizedButton.length > 0 ? this.authorizedButton[0] : null;
    if (authButton) {
      authButton.textContent = this.getAuthButtonContent();
    }

    const unauthButton: Node | null = this.unauthorizedButton && this.unauthorizedButton.length > 0 ? this.unauthorizedButton[0] : null;
    if (unauthButton) {
      unauthButton.textContent = this.getUnauthButtonContent();
    }
  }

  getToAddress(): string | null {
    if (!!this.currentImparter) {
      switch(this.currentImparter) {
        case Imparter.btcManual:
          return this.bitcoinAddress || null;
        case Imparter.ethWeb3:
          return this.ethereumAddress || null;
        default:
          return this.overhideAddress || null;          
      }
    }
    return null;
  }

  getAuthButtonContent(): string {
    return this.loginMessage ? this.loginMessage : this.authorizedMessage;;
  }

  getUnauthButtonContent(): string {
    return this.loginMessage ? this.loginMessage : this.unauthorizedTemplate.replace(/\$\{topup\}/g, this.toDollars(this.topupDollars));
  }

  isClickable(): boolean {
    return this.isAuthorized || !this.inhibitLogin || !!this.loginMessage;
  }

  // @throws 
  async determineAuthorized(): Promise<boolean> {
    const address = this.getToAddress();
    if (!this.isLogedIn) {
      return false;
    }

    if (!this.hub) {
      console.error(`no hub`);
      throw `no hub`;
    }

    if (!this.lastInfo) {
      console.error(`no lastInfo`);
      throw `no lastInfo`;
    }
    
    if (!this.signature) {
      return false;
    }

    if (!this.priceDollars) {
      var price: number = 0;
    } else {
      var price: number = parseFloat(this.priceDollars);
    }

    if (price == 0) {    
      this.topupDollars = 0;  
      return this.lastInfo.isOnLedger[this.currentImparter || Imparter.unknown];
    }

    if (!address) {
      const message = `allowed user to log in with $${this.currentImparter} but pay2myapp-appsell component with sku ${this.sku} doesn't have an address setup for that ledger`;
      console.error(message);
      throw message;
    }

    const result = await this.hub.getOutstanding(price, address, this.withinMinutes ? parseFloat(this.withinMinutes) : null);
    if (result && typeof result.delta === 'number') {
      this.topupDollars = result.delta;
      this.asOf = result.asOf;  
    }

    const event: IPay2MyAppSkuTopupOutstandingEvent = <IPay2MyAppSkuTopupOutstandingEvent> {
      sku: this.sku,
      topup: this.topupDollars
    }
    this.$emit(`pay2myapp-appsell-topup-outstanding`, event);
    return this.topupDollars == 0;
  }

  // @returns {Promise<boolean>} with status of topup -- successful or not.
  async authorize(): Promise<boolean> {
    let isAuthorized = false;
    try {
      this.loading = true;
      isAuthorized = await this.determineAuthorized();
      const address = this.getToAddress();
      if (this.hub && !isAuthorized) {
        isAuthorized = await this.hub.topUp(this.topupDollars || 0, address);
      }
    } catch (e) {
    } finally {
      this.loading = false;
    }
    return isAuthorized;
  }
}
