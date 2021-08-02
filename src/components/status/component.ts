import {
  customElement,
  FASTElement,
  html,
  css,
  attr,
  observable,
  Observable,
  when
} from "@microsoft/fast-element";

import {
  Imparter,
  IOverhideHub,
  IOverhideLogin,
  IOverhideStatus,
  NetworkType,
  PaymentsInfo,
  Social
} from '../hub/definitions';

import w3Css from "../../static/w3.css";
import microsoftIcon from "../../static/icons/microsoft.svg";
import googleIcon from "../../static/icons/google.svg";
import ethIcon from "../../static/icons/ethereum.svg";
import bitcoinIcon from "../../static/icons/bitcoin.svg";
import passphraseIcon from "../../static/icons/passphrase.svg";
import walletIcon from "../../static/icons/wallet.svg";
import deniedIcon from "../../static/icons/denied.svg";
import logoutIcon from "../../static/icons/logout.svg";
import errorIcon from "../../static/icons/error.svg";
import refreshIcon from "../../static/icons/refresh.svg";

const template = html<OverhideStatus>`
  <div class="input">
    <div class="panel ${e => e.error ? 'w3-tooltip' : ''}">
      <div class="${e => e.canGetTransactions ? '' : 'disabled'}">

        ${when(e => e.error, html<OverhideStatus>`
          <span class="name svg3" @click="${e => e.addressClicked()}">${errorIcon}</span>
        `)}
        ${when(e => !e.logo && !e.error, html<OverhideStatus>`
          <span class="name svg3" @click="${e => e.addressClicked()}">${deniedIcon}</span>
        `)}
        ${when(e => e.logo == 'microsoft' && !e.error, html<OverhideStatus>`
          <span class="name svg3" @click="${e => e.addressClicked()}">${microsoftIcon}</span>
        `)}
        ${when(e => e.logo == 'google' && !e.error, html<OverhideStatus>`
          <span class="name svg3" @click="${e => e.addressClicked()}">${googleIcon}</span>
        `)}
        ${when(e => e.logo == 'wallet' && !e.error, html<OverhideStatus>`
          <span class="name svg3" @click="${e => e.addressClicked()}">${walletIcon}</span>
        `)}
        ${when(e => e.logo == 'eth' && !e.error, html<OverhideStatus>`
          <span class="name svg3" @click="${e => e.addressClicked()}">${ethIcon}</span>
        `)}
        ${when(e => e.logo == 'bitcoin' && !e.error, html<OverhideStatus>`
          <span class="name svg3" @click="${e => e.addressClicked()}">${bitcoinIcon}</span>
        `)}
        ${when(e => e.logo == 'passphrase' && !e.error, html<OverhideStatus>`
          <span class="name svg3" @click="${e => e.addressClicked()}">${passphraseIcon}</span>
        `)}
      </div>

      <div @click="${e => e.addressClicked()}">
        <div class="label"><span>&nbsp;${e => e.address}</span></div>
      </div>
      
      ${when(e => e.error, html<OverhideStatus>`
        <span class="right-tooltip w3-text w3-tag w3-round-xlarge">
          ${e => e.error}
        </span>        
      `)}

      <div class="logout svg2 ${e => e.canGetTransactions ? '' : 'disabled'}">
        <div class="refresh-svg" @click="${e => e.refresh()}">${refreshIcon}</div>
      </div>
      <div class="logout svg2 ${e => e.canLogout ? '' : 'disabled'}">
        <div class="logout-svg" @click="${e => e.logout()}">${logoutIcon}</div>
      </div>
    </div>
  </div>
`;

const styles = css`
${w3Css}

  .svg3 svg {
    width: 1.2em;
    height: 1.2em;
  }

  .panel {
    display: flex;
  }

  .panel .disabled {
    opacity: .5;
    cursor: default;
  }

  .input {
    margin-left: .5em;
    margin-right: .5em;
    cursor:pointer;
  }
  
  .input input {
    width: 100%;
  }

  .panel .name {
    left: 1px;
    top: 6px;
    min-width: 1.5em;
    text-align: center;
    position: relative;
  }    
 
  .panel .logout {
    display: flex;
    min-width: 1.5em;
    text-align: center;
    cursor:pointer;
  }

  .logout-svg {
    top: 2px;
    right: 1px;
    position: relative;
  }

  .refresh-svg {
    top: 5px;
    right: 1px;
    position: relative;
  }

  .panel .logout.disabled {
    opacity: .5;
    cursor: default;
  }  

  .panel .logout svg {
    width: 1.5em;
  }  

  .label {
    width: 6em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    position: relative;
    top: 3px;
  }

  .label span {
    height: 1em;
  }

  .right-tooltip {
    position:fixed;
    right: 5em;
    top: 5em;
    width: 15em;
    z-index: 50;
  }  
`;


@customElement({
  name: "overhide-status",
  template,
  styles,
})
export class OverhideStatus extends FASTElement implements IOverhideStatus {
  @attr 
  hubId?: string;

  @observable
  error?: string | null

  @observable
  logo?: string | null;

  @observable
  address?: string | null = 'sign-in';

  @observable
  canLogout?: boolean | null;

  @observable
  canGetTransactions?: boolean | null;

  hub?: IOverhideHub | null; 
  currentImparter?: Imparter | null;
  isSignedIn: boolean = false;
  loginElement?: IOverhideLogin | null;

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
          case 'error':
            that.errorSet(source.error);
            break;
        } 
      }
    }

    notifier.subscribe(handler, 'paymentsInfo')
    notifier.subscribe(handler, 'error')
  }

  hubIdChanged(oldValue: string, newValue: string) {
    const el = document.querySelector(`#${this.hubId}`);
    if (!el) {
      console.log(`WARNING: overhide-status configured for overhide-hub with ID ${newValue} but no element in DOM with this ID.`);
      return;
    }
    this.setHub(el);
  }

  connectedCallback() {
    super.connectedCallback();
  };

  paymentInfoChanged(info: PaymentsInfo): void {
    this.error = null;
    this.currentImparter = info.currentImparter;
    this.isSignedIn = !!info.payerSignature[info.currentImparter];
    this.address = this.isSignedIn ? info.payerAddress[info.currentImparter] : 'sign-in';
    this.loginElement = info.loginElement;
    this.canLogout = false;
    this.canGetTransactions = false;
    this.logo = null;   
    if (info.payerSignature[info.currentImparter]) {
      switch (info.currentImparter) {
        case Imparter.ohledgerSocial:
          switch (info.currentSocial) {
            case Social.microsoft:
              this.logo = 'microsoft';
              this.canLogout = true;
              this.canGetTransactions = true;
              break;
            case Social.google:
              this.logo = 'google';
              this.canLogout = true;
              this.canGetTransactions = true;
              break;
            default:
              this.logo = null;            
          }
          break;
        case Imparter.ohledgerWeb3:
          this.logo = 'wallet';
          this.canLogout = true;
          this.canGetTransactions = true;
          break;
        case Imparter.ethWeb3:
          this.logo = 'eth';
          this.canLogout = true;
          this.canGetTransactions = true;
          break;
        case Imparter.btcManual:
          this.logo = 'bitcoin';
          this.canLogout = true;
          this.canGetTransactions = true;
          break;
        case Imparter.ohledger:
          this.logo = 'passphrase';
          this.canLogout = true;
          this.canGetTransactions = true;
          break;
        default:
          this.logo = null;
      }  
    }
  }

  logout(): void {
    if (this.hub && this.currentImparter && this.canLogout) {
      this.hub.logout();
      this.hub.clear(this.currentImparter);
    }
  }

  refresh(): void {
    if (this.hub && this.currentImparter && this.canGetTransactions) {
      this.hub.refresh(this.currentImparter);
    }
  }

  errorSet(error: string): void {
    this.error = error;
    this.address = 'problem';
  }

  addressClicked() {
    if (this.hub && !this.isSignedIn && !!this.loginElement) {
      this.loginElement.open();
    } 
    if (this.hub && this.isSignedIn && this.currentImparter && !this.error) {
      switch (this.currentImparter) {
        case Imparter.ohledger:
        case Imparter.ohledgerWeb3:
        case Imparter.ohledgerSocial:
          window.open(`${this.hub.getUrl(Imparter.ohledger)}/ledger.html?address=${this.address}`,
          'targetWindow',
          'toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=300')
          break;
        case Imparter.btcManual:
          var url = this.hub.getNetworkType() == NetworkType.prod ? 'https://www.blockchain.com/btc/address/' : 'https://www.blockchain.com/btc-testnet/address/' ;
          window.open(`${url}${this.address}`,
            'targetWindow',
            'toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=800');
          break;
        case Imparter.ethWeb3:
          var url = this.hub.getNetworkType() == NetworkType.prod ? 'https://etherscan.io/address/' : 'https://rinkeby.etherscan.io/address/' ;
          window.open(`${url}${this.address}`,
            'targetWindow',
            'toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=800');
          break;
      }
    }
  }
}
