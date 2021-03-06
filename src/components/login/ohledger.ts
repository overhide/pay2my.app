import {
  customElement,
  FASTElement,
  html,
  css,
  attr,
  ref,
  Observable,
  observable
} from "@microsoft/fast-element";

import {
  Imparter,
  IPay2MyAppHub,
  PaymentsInfo
} from '../hub/definitions';

import w3Css from "../../static/w3.css";
import widgetCss from "./widget.css";
import infoIcon from "../../static/icons/info.svg";
import clipboardIcon from "../../static/icons/clipboard.svg";
import passphraseIcon from "../../static/icons/passphrase.svg";

declare global {
  interface Window {
    PasswordCredential: any;
  }
}

const template = html<OverhideOhledger>`
  <div class="panel w3-panel w3-border w3-round-xxlarge ${e => e.isActive ? 'active' : ''}">
    <div class="w3-row w3-margin">
      <div class="w3-col s6 w3-left-align">
        <span class="name svg3">${passphraseIcon} secret token</span>
      </div>
      <div class="currency-span w3-col s6 w3-right-align">
        <span class="currency w3-text-dark-grey">dollars</span>
        <span class="info svg w3-tooltip">
          ${infoIcon}
          <span class="right-tooltip w3-text w3-tag w3-round-xlarge">
            for any in-app purchases, payments would be in US dollars
          </span>
        </span>
      </div>
    </div>
    <form autocomplete="on" ${ref('autocompleteForm')} action="#" method="get" target="noop">
      <div class="w3-row w3-margin">
        <div class="w3-col s12">
          <input autocomplete="username" name="username" id="username" class="w3-hide" type="text" :value="${e => e.address || ''}">        
          <div class="input">
            <div class="clipboard">
              <div class="clickable svg2" @click="${e => e.copyToClipboard()}" :disabled="${e => !e.isKeyValid}">${clipboardIcon}</div>
              <input autocomplete="current-password" name="password" id="password" class="w3-input" type="password" :value="${e => e.key || ''}" @change="${(e, c) => e.changeKey(c.event)}" @keyup="${(e, c) => e.changeKey(c.event)}" @click="${e => e.loadFromPasswordManager()}">
            </div>
            <label>secret token</label>
          </div>
        </div>
      </div>
      <div class="w3-row w3-margin">
        <div class="w3-col s6">
          <div class="input">
            <input class="w3-button w3-dark-grey" type="button" @click="${e => e.generate()}" value="generate new">
          </div>
        </div>
        <div class="w3-col s6">
          <div class="input">
            <input class="w3-button w3-border w3-border-grey" type="button" @click="${e => e.showTransactions()}" value="show transactions" :disabled="${e => !e.isKeyValid || !e.challenge || !e.signature}">
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
        <div class="w3-col s12">
          <div class="input">
            <input type="submit" class="w3-button w3-blue-grey w3-wide" value="continue" :disabled="${e => !e.isKeyValid}" @click="${e => e.continue()}">
          </div>
        </div>
      </div>    
    </form>
    <iframe name="noop" style="display: none"></iframe>
  </div>
`;

const styles = css`
  ${w3Css}
  ${widgetCss}
`;

@customElement({
  name: "pay2myapp-ohledger",
  template,
  styles,
})
export class OverhideOhledger extends FASTElement {
  @attr
  hubId?: string;

  @observable
  key?: string | null;

  @observable
  address?: string | null;

  @observable
  isKeyValid: boolean = false;

  @observable
  isActive: boolean = false;

  @observable
  messageClass: string = 'normalMessage';

  @observable
  message?: any;

  @observable
  challenge?: string | null;

  @observable
  signature?: string | null;

  autocompleteForm?: HTMLFormElement;

  hub?: IPay2MyAppHub;

  public constructor() {
    super();
    this.setNormalMessage();
  }

  public setHub(hub: IPay2MyAppHub) {
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
    this.address = info.payerAddress[Imparter.ohledger];
    this.isActive = info.currentImparter === Imparter.ohledger && !!info.payerSignature[info.currentImparter] && !!info.isOnLedger[info.currentImparter];
    this.challenge = info.messageToSign[info.currentImparter];
    this.signature = info.payerSignature[info.currentImparter];

    if (info.payerPrivateKey[Imparter.ohledger] != this.key) {
      this.changeKey({ target: { value: info.payerPrivateKey[Imparter.ohledger] } });
    }
  }

  async changeKey(event: any) {
    await this.updateKey(event.target.value);
  }

  async updateKey(key: string) {
    this.key = key;
    this.isKeyValid = false;
    this.setNormalMessage();
    if (this.hub && this.key) {
      this.isKeyValid = (/^0x[0-9a-fA-F]{64}$/.test(this.key)) && await this.hub.setSecretKey(Imparter.ohledger, this.key);
      if (!this.isKeyValid) {
        this.setInvalidMessage();
      }
    }
  }

  async generate() {
    this.setNormalMessage();
    if (this.hub) {
      await this.hub.generateNewKeys(Imparter.ohledger);
      this.isKeyValid = true;
    }
  }

  setNormalMessage() {
    this.messageClass = 'normalMessage';
    this.message = html`Login with a secret token &mdash; Remember this token &mdash; You will need it for future logins &mdash; Keep this token safe in password manager`;
  }

  setInvalidMessage() {
    this.messageClass = 'invalidMessage';
    this.message = html`The secret token must be a 64 characters '0x' prefixed hexadecimal value &mdash; <b>Easiest to just generate</b>`;
  }

  copyToClipboard() {
    if (!this.key) return;
    const el = document.createElement('textarea');
    el.value = this.key;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }

  showTransactions() {
    if (this.hub && this.key && this.isKeyValid && this.address && this.signature && this.challenge) {
      window.open(`${this.hub.getUrl(Imparter.ohledger)}/ledger.html?address=${this.address}&t-signature=${btoa(this.signature)}&t-challenge=${btoa(this.challenge)}`,
        'targetWindow',
        'toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=300')
    }
  }

  async continue() {
    if (this.hub && this.key && this.isKeyValid && this.address) {
      try {
        if ("PasswordCredential" in window) {
          let credential = new window.PasswordCredential({
            id: `overhide ledger address:  ${this.address}`,
            password: this.key
          });      
          await navigator.credentials.store(credential);
        }

        if (this.autocompleteForm) this.autocompleteForm.submit();

      } catch(e) {
        console.error(e);
      }

      await this.hub.setCurrentImparter(Imparter.ohledger);
      this.$emit('close');
    }
  }

  async loadFromPasswordManager() {
    try {
      if ("PasswordCredential" in window) {
        let opts: any = { password: true };
        let creds: any = await navigator.credentials.get(opts)
        if (creds != null && 'password' in creds && creds.password != null) {
          await this.updateKey(creds.password);
        }
      }  
    } catch (e) {
      console.error(e);
    }
  }
}
