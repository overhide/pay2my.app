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
  IPay2MyAppHub,
  PaymentsInfo,
  Social
} from '../hub/definitions';

import w3Css from "../../static/w3.css";
import widgetCss from "./widget.css";
import infoIcon from "../../static/icons/info.svg";
import microsoftIcon from "../../static/icons/microsoft.svg";

const template = html<OverhideOhSocialMs>`
  <div class="panel w3-panel w3-border w3-round-xxlarge ${e => e.isActive ? 'active' : ''}">
    <div class="w3-row w3-margin">
      <div class="w3-col s6 w3-left-align">
        <span class="name svg3"${microsoftIcon} Microsoft social login</span>
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
    <form>
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
            <input type="submit" class="w3-button w3-blue-grey w3-wide" type="button" value="continue" @click="${e => e.continue()}">
          </div>
        </div>
        <div class="w3-col s6">
          <div class="input">
            <input class="w3-button w3-border w3-border-grey" type="button" @click="${e => e.showTransactions()}" value="show transactions" :disabled="${e => !e.address || !e.isActive || !e.challenge || !e.signature}">
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
  name: "pay2myapp-ohsocial-ms",
  template,
  styles,
})
export class OverhideOhSocialMs extends FASTElement {
  @attr 
  hubId?: string;

  @observable
  address?: string | null;

  @observable
  isActive: boolean = false;

  @observable
  messageClass: string = 'normalMessage';

  @observable
  message?:any;

  @observable
  challenge?: string | null;

  @observable
  signature?: string | null;

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
    this.address = info.payerAddress[Imparter.ohledgerSocial];
    this.isActive = info.currentImparter === Imparter.ohledgerSocial && info.currentSocial === Social.microsoft && !!info.payerSignature[info.currentImparter] && !!info.isOnLedger[info.currentImparter];
    this.challenge = info.messageToSign[info.currentImparter];
    this.signature = info.payerSignature[info.currentImparter];
  }

  setNormalMessage() {
    this.messageClass = 'normalMessage';
    this.message = null;
  }

  setInvalidMessage() {
    this.messageClass = 'invalidMessage';
    this.message = html`There was a problem logging you in.`;
  }

  showTransactions() {
    if (this.hub && this.address && this.signature && this.challenge) {
      window.open(`${this.hub.getUrl(Imparter.ohledger)}/ledger.html?address=${this.address}&t-signature=${btoa(this.signature)}&t-challenge=${btoa(this.challenge)}`,
        'targetWindow',
        'toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=300')
    }
  }

  async continue() {
    if (this.hub) {
      await this.hub.setCurrentSocial(Social.microsoft);
      const result: boolean = await this.hub.setCurrentImparter(Imparter.ohledgerSocial);
      if (!result) {
        this.setInvalidMessage();
        return;
      } 
      this.$emit('close');
    }
  }
}
