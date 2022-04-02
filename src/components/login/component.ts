import {
  attr,
  css,
  customElement,
  html,
  ref,
  when,
  FASTElement,
  Observable,
  observable
} from "@microsoft/fast-element";

import {
  IPay2MyAppLogin,
  IPay2MyAppHub,
  PaymentsInfo
} from '../hub/definitions';

import { OverhideOhledger } from './ohledger';
import { OverhideBtcManual } from './btc-manual';
import { OverhideOhSocialMs } from './ohsocial-ms';
import { OverhideOhSocialGoogle } from './ohsocial-google';
import { OverhideOhWeb3 } from './ohledger-web3';
import { OverhideEthWeb3 } from './eth-web3';

import w3Css from "../../static/w3.css";
import closeIcon from "../../static/icons/close.svg";

OverhideOhledger;
OverhideBtcManual;
OverhideOhSocialMs;
OverhideOhSocialGoogle;
OverhideOhWeb3;
OverhideEthWeb3;

const template = html<Pay2MyAppLogin>`
  <div class="w3-modal root" ${ref('rootElement')} style="padding-top: 0px; padding-bottom: 0px;">
    <div class="envelope" ${ref('envelopeElement')} @click="${(e, c) => e.outsideClick(c.event)}">
      <div class="w3-modal-content modal">
      <div class="w3-display-container modal-container">

        <slot name="closeButton">
          <button class="close-button w3-right w3-display-topright" type="button" @click="${(e, c) => e.close(false)}">${closeIcon}</button>
        </slot>

        <div class="modal">
          <div class="w3-container ${e => e.isEnabled ? '' : 'w3-disabled'}">
            <slot name="header"></slot>
            ${when(e => e.overhideSocialMicrosoftEnabled, html<Pay2MyAppLogin>`
              <div class="s12">
                <pay2myapp-ohsocial-ms ${ref('overhideSocialMicrosoftElement')} hubId="${e => e.hubId}" @close="${(e) => e.close()}"></pay2myapp-ohsocial-ms>
              </div>
            `)}
            ${when(e => e.overhideSocialGoogleEnabled, html<Pay2MyAppLogin>`
              <div class="s12">
                <pay2myapp-ohsocial-google ${ref('overhideSocialGoogleElement')} hubId="${e => e.hubId}" @close="${(e) => e.close()}"></pay2myapp-ohsocial-google>
              </div>
            `)}            
            ${when(e => e.overhideWeb3Enabled, html<Pay2MyAppLogin>`
              <div class="s12">
                <pay2myapp-ohledger-web3 ${ref('overhideOhledgerWeb3Element')} hubId="${e => e.hubId}" @close="${(e) => e.close()}"></pay2myapp-ohledger-web3>
              </div>
            `)}            
            ${when(e => e.ethereumWeb3Enabled, html<Pay2MyAppLogin>`
              <div class="s12">
                <pay2myapp-eth-web3 ${ref('overhideEthereumWeb3Element')} hubId="${e => e.hubId}" @close="${(e) => e.close()}"></pay2myapp-eth-web3>
              </div>
            `)}            
            ${when(e => e.bitcoinEnabled, html<Pay2MyAppLogin>`
              <div class="s12">
                <pay2myapp-btc-manual ${ref('overhideBitcoinElement')} hubId="${e => e.hubId}" @close="${(e) => e.close()}"></pay2myapp-btc-manual>
              </div>
            `)}            
            ${when(e => e.overhideSecretTokenEnabled, html<Pay2MyAppLogin>`
              <div class="s12">
                <pay2myapp-ohledger ${ref('overhideLedgerElement')} hubId="${e => e.hubId}" @close="${(e) => e.close()}"></pay2myapp-ohledger>
              </div>
            `)}
          </div>
        </div>
      </div>
      </div>
    </div>
  </div>
`;

const styles = css`
  ${w3Css}
  
  .root {
    contain: none;
    font-family: "Segoe UI", Arial, sans-serif;
  }  

  svg {
    margin-top: 3px;
    width: 1em;
    height: 1em;
  }

  .modal {
    max-width: 40em;
    max-height: 80vh;
    color: black;
    background: white;
    overflow-y: auto;
  }

  .modal-container {
    max-width: 40em;
    max-height: 80vh;
  }

  .content {
    overflow-y: scroll;
  }

  .envelope {
    width: 100%;
    height: 100%;
    padding-top: 70px;
  }

  .close-button {
    background: white;
    border: none;
    cursor: pointer;
    padding: 4px;
    padding-right: 6px;
  }
`;


@customElement({
  name: "pay2myapp-login",
  template,
  styles,
})
export class Pay2MyAppLogin extends FASTElement implements IPay2MyAppLogin {
  @attr 
  hubId?: string;

  @attr({ mode: 'boolean' })
  overhideSecretTokenEnabled?: boolean = false;

  @attr({ mode: 'boolean' })
  bitcoinEnabled?: boolean = false;

  @attr({ mode: 'boolean' })
  overhideSocialMicrosoftEnabled?: boolean = false;

  @attr({ mode: 'boolean' })
  overhideSocialGoogleEnabled?: boolean = false;

  @attr({ mode: 'boolean' })
  overhideWeb3Enabled?: boolean = false;

  @attr({ mode: 'boolean' })
  ethereumWeb3Enabled?: boolean = false;

  @observable
  public isEnabled?: boolean | null;

  rootElement?: HTMLElement;
  envelopeElement?: HTMLElement;
  overhideSocialMicrosoftElement?: HTMLElement;
  overhideSocialGoogleElement?: HTMLElement;
  overhideOhledgerWeb3Element?: HTMLElement;
  overhideEthereumWeb3Element?: HTMLElement;
  overhideBitcoinElement?: HTMLElement;
  overhideLedgerElement?: HTMLElement;
  hub?: IPay2MyAppHub; 
  opens: any[] = [];

  public constructor() {
    super(); 
  }

  // Open the login modal
  public open(): Promise<boolean> {
    if (this.rootElement) {
      this.rootElement.style.display = 'block';
      this.$emit('pay2myapp-login-open');
      return new Promise<boolean>((resolve, reject) => {
        this.opens.push(resolve);
      });;      
    }
    return Promise.resolve(false);
  }

  // Close the login modal
  public close(done: boolean = true): void {
    if (this.rootElement) {
      this.rootElement.style.display = 'none';
      this.$emit('pay2myapp-login-close');
      this.opens.forEach(resolve => resolve(done));
      this.opens = [];
    }
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
    this.hub.setLoginElement(this);

    if (this.overhideSocialMicrosoftElement) (this.overhideSocialMicrosoftElement as any).setHub(hub);
    if (this.overhideSocialGoogleElement) (this.overhideSocialGoogleElement as any).setHub(hub);
    if (this.overhideOhledgerWeb3Element) (this.overhideOhledgerWeb3Element as any).setHub(hub);
    if (this.overhideEthereumWeb3Element) (this.overhideEthereumWeb3Element as any).setHub(hub);
    if (this.overhideBitcoinElement) (this.overhideBitcoinElement as any).setHub(hub);
    if (this.overhideLedgerElement) (this.overhideLedgerElement as any).setHub(hub);

    notifier.subscribe(handler, 'paymentsInfo')
    notifier.subscribe(handler, 'error')
  }

  hubIdChanged(oldValue: string, newValue: string) {
    const el = document.querySelector(`#${this.hubId}`) as any;
    if (!el) {
      console.log(`WARNING: pay2myapp-login configured for pay2myapp-hub with ID ${newValue} but no element in DOM with this ID.`);
      return;
    }
    if (!el.THIS_IS_OVERHIDE_HUB) {
      console.log(`WARNING: pay2myapp-login configured for pay2myapp-hub with ID ${newValue} but element with this ID is not an pay2myapp-hub element.`);
      return;
    }
    this.setHub(el);
  }

  connectedCallback() {
    super.connectedCallback();

    window.addEventListener('keydown', (event: any) => {
      if (event.key == 'Escape') {
        this.close(false);
      }
    });  
  };

  paymentInfoChanged(info: PaymentsInfo): void {
    this.isEnabled = info.enabled;
  }

  outsideClick(event: any) {
    if (event.target == this.envelopeElement) {
      this.close(false);
    }
  }
}
