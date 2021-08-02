import {
  customElement,
  FASTElement,
  html,
  css,
  attr,
  Observable,
  observable
} from "@microsoft/fast-element";

import {
  Imparter,
  IOverhideHub,
  PaymentsInfo,
  NetworkType
} from '../hub/definitions';

import w3Css from "../../static/w3.css";
import widgetCss from "./widget.css";
import infoIcon from "../../static/icons/info.svg";
import clipboardIcon from "../../static/icons/clipboard.svg";
import bitcoinIcon from "../../static/icons/bitcoin.svg";

const template = html<OverhideBtcManual>`
  <div class="panel w3-panel w3-border w3-round-xxlarge ${e => e.isActive ? 'active' : ''}">
    <div class="w3-row w3-margin">
      <div class="w3-col s6 w3-left-align">
        <span class="name svg svg3">${bitcoinIcon} bitcoin login</span>
      </div>
      <div class="currency-span w3-col s6 w3-right-align">
        <span class="currency w3-text-dark-grey">bitcoins</span>
        <span class="info svg w3-tooltip">
          ${infoIcon}
          <span class="right-tooltip w3-text w3-tag w3-round-xlarge">
            for any in-app purchases, payments would be in bitcoins (satoshis)
          </span>
        </span>
      </div>
    </div>
    <form>
      <div class="w3-row w3-margin">
        <div class="w3-col s12">
          <div class="input">
            <div class="clipboard">
              <div class="clickable svg2" @click="${e => e.copyToClipboard()}" :disabled="${e => !e.isAddressValid}">${clipboardIcon}</div>
              <input autocomplete="account" name="account" id="account" class="w3-input" type="text" :value="${e => e.address || ''}" @change="${(e,c) => e.changeAddress(c.event)}" @keyup="${(e,c) => e.changeAddress(c.event)}">
            </div>
            <label>bitcoin address</label>
          </div>
        </div>
      </div>
      <div class="w3-row w3-margin">
        <div class="message w3-col s12">
          <span class="${e => e.messageClass}">
            ${e => e.message}
          </span>
        </div>
      </div>    
      <div class="w3-row w3-margin">
        <div class="w3-col s6">
          <div class="input">
            <input type="submit" class="w3-button w3-blue-grey w3-wide" type="button" value="continue" @click="${e => e.continue()}" :disabled="${e => !e.isAddressValid}">
          </div>
        </div>
        <div class="w3-col s6">
          <div class="input">
            <input class="w3-button w3-border w3-border-grey" type="button" @click="${e => e.showTransactions()}" value="show transactions" :disabled="${e => !e.address}">
          </div>
        </div>        
      </div>    
    </form>
  </div>
`;

const styles = css`
  ${w3Css}
  ${widgetCss}
`;


@customElement({
  name: "overhide-btc-manual",
  template,
  styles,
})
export class OverhideBtcManual extends FASTElement {
  @attr 
  hubId?: string;

  @observable
  address?: string | null;

  @observable
  isAddressValid: boolean = false;

  @observable
  isActive: boolean = false;

  @observable
  messageClass: string = 'normalMessage';

  @observable
  message?:any;

  hub?: IOverhideHub; 

  public constructor() {
    super();
    this.setNormalMessage();
  }

  public setHub(hub: IOverhideHub) {
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

    notifier.subscribe(handler, 'paymentsInfo')
    notifier.subscribe(handler, 'error')
  }

  hubIdChanged(oldValue: string, newValue: string) {
    this.setHub(document.querySelector(`#${this.hubId}`) as any);
  }

  connectedCallback() {
    super.connectedCallback();
  };

  paymentInfoChanged(info: PaymentsInfo): void {
    this.isActive = info.currentImparter === Imparter.btcManual && !!info.payerSignature[info.currentImparter];

    if (info.payerAddress[Imparter.btcManual] != this.address) {
      this.changeAddress({target: {value: info.payerAddress[Imparter.btcManual]}});
    }
  }

  async changeAddress(event: any) {
    this.address = event.target.value;
    this.isAddressValid = false;
    this.setNormalMessage();
    if (this.hub && this.address) {
      this.isAddressValid = await this.hub.setAddress(Imparter.btcManual, this.address);
      if (!this.isAddressValid) {
        this.setInvalidMessage();
      }
    }
  }

  setNormalMessage() {
    this.messageClass = 'normalMessage';
    this.message = html`Provide your bitcoin address &mdash; Always login with same address &mdash; Not a change-addresses`;
  }

  setInvalidMessage() {
    this.messageClass = 'invalidMessage';
    const network = this.hub ? this.hub.getNetworkType() == NetworkType.test ? `<b>for testnet</b>` : `<b>for mainnet</b>` : ``;
    this.message = html`The address must be a valid bitcoin address &mdash; ${network}`;
  }

  showTransactions() {
    if (this.hub && this.address) {
      const url = this.hub.getNetworkType() == NetworkType.prod ? 'https://www.blockchain.com/btc/address/' : 'https://www.blockchain.com/btc-testnet/address/' ;
      window.open(`${url}${this.address}`,
        'targetWindow',
        'toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=800')
    }
  }

  copyToClipboard() {
    if (!this.address) return;
    const el = document.createElement('textarea');
    el.value = this.address;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }

  async continue() {
    if (this.hub && this.address && this.isAddressValid) {
      await this.hub.setCurrentImparter(Imparter.btcManual);
      this.$emit('close');
    }
  }
}
