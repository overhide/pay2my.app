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
  NetworkType,
  PaymentsInfo,
  Social
} from '../hub/definitions';

import w3Css from "../../static/w3.css";
import widgetCss from "./widget.css";
import infoIcon from "../../static/icons/info.svg";
import ethIcon from "../../static/icons/ethereum.svg";

const template = html<OverhideEthWeb3>`
  <div class="panel w3-panel w3-border w3-round-xxlarge ${e => e.isActive ? 'active' : ''}">
    <div class="w3-row w3-margin">
      <div class="w3-col s6 w3-left-align">
        <span class="name svg3">${ethIcon} ethereum login</span>
      </div>
      <div class="currency-span w3-col s6 w3-right-align">
        <span class="currency w3-text-dark-grey">ethers</span>
        <span class="info svg w3-tooltip">
          ${infoIcon}
          <span class="right-tooltip w3-text w3-tag w3-round-xlarge">
            for any in-app purchases, payments would be in ethers (wei)
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
            <input type="submit" class="w3-button w3-blue-grey w3-wide" type="button" value="continue" @click="${e => e.continue()}" :disabled="${e => !e.hasWallet}">
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
  name: "overhide-eth-web3",
  template,
  styles,
})
export class OverhideEthWeb3 extends FASTElement {
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
  hasWallet?: boolean;

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
    this.address = info.payerAddress[Imparter.ethWeb3];
    if (this.address) {
      this.setNormalMessage();
    }
    this.isActive = info.currentImparter === Imparter.ethWeb3 && !!info.payerSignature[info.currentImparter];
    this.hasWallet = info.wallet[Imparter.ethWeb3];
  }

  setNormalMessage() {
    this.messageClass = 'normalMessage';
    if (this.hasWallet) {
      this.message = `Address: ${this.address}`;
    } else {
      this.message = `Connect a Web3 wallet`;
    }    
  }

  setInvalidMessage() {
    this.messageClass = 'invalidMessage';
    this.message = html`There was a problem logging you in.`;
  }

  showTransactions() {
    if (this.hub && this.address) {
      const url = this.hub.getNetworkType() == NetworkType.prod ? 'https://etherscan.io/address/' : 'https://rinkeby.etherscan.io/address/' ;
      window.open(`${url}${this.address}`,
        'targetWindow',
        'toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=800')
    }
  }

  async continue() {
    if (this.hub) {
      const result: boolean = await this.hub.setCurrentImparter(Imparter.ethWeb3);
      if (!result) {
        this.setInvalidMessage();
        return;
      } 
      this.$emit('close');
    }
  }
}
