import {
  attr,
  css,
  customElement,
  html,
  ref,
  when,
  FASTElement,
  Observable
} from "@microsoft/fast-element";

import {
  IOverhideLogin,
  IOverhideHub,
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

const template = html<OverhideLogin>`
  <div class="w3-modal root" ${ref('rootElement')} style="padding-top: 0px; padding-bottom: 0px;">
    <div class="envelope" ${ref('envelopeElement')} @click="${(e, c) => e.outsideClick(c.event)}">
      <div class="w3-modal-content modal">
      <div class="w3-display-container modal-container">

        <slot name="closeButton">
          <button class="close-button w3-right w3-display-topright" type="button" @click="${(e, c) => e.close()}">${closeIcon}</button>
        </slot>

        <div class="modal">
          <div class="w3-container">
            <slot name="header"></slot>
            ${when(e => e.overhideSocialMicrosoftEnabled, html<OverhideLogin>`
              <div class="s12">
                <overhide-ohsocial-ms ${ref('overhideSocialMicrosoftElement')} hubId="${e => e.hubId}" @close="${(e) => e.close()}"></overhide-ohsocial-ms>
              </div>
            `)}
            ${when(e => e.overhideSocialGoogleEnabled, html<OverhideLogin>`
              <div class="s12">
                <overhide-ohsocial-google ${ref('overhideSocialGoogleElement')} hubId="${e => e.hubId}" @close="${(e) => e.close()}"></overhide-ohsocial-google>
              </div>
            `)}            
            ${when(e => e.overhideOhledgerWeb3Enabled, html<OverhideLogin>`
              <div class="s12">
                <overhide-ohledger-web3 ${ref('overhideOhledgerWeb3Element')} hubId="${e => e.hubId}" @close="${(e) => e.close()}"></overhide-ohledger-web3>
              </div>
            `)}            
            ${when(e => e.overhideEthereumWeb3Enabled, html<OverhideLogin>`
              <div class="s12">
                <overhide-eth-web3 ${ref('overhideEthereumWeb3Element')} hubId="${e => e.hubId}" @close="${(e) => e.close()}"></overhide-eth-web3>
              </div>
            `)}            
            ${when(e => e.overhideBitcoinEnabled, html<OverhideLogin>`
              <div class="s12">
                <overhide-btc-manual ${ref('overhideBitcoinElement')} hubId="${e => e.hubId}" @close="${(e) => e.close()}"></overhide-btc-manual>
              </div>
            `)}            
            ${when(e => e.overhideLedgerEnabled, html<OverhideLogin>`
              <div class="s12">
                <overhide-ohledger ${ref('overhideLedgerElement')} hubId="${e => e.hubId}" @close="${(e) => e.close()}"></overhide-ohledger>
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
  name: "overhide-login",
  template,
  styles,
})
export class OverhideLogin extends FASTElement implements IOverhideLogin {
  @attr 
  hubId?: string;

  @attr({ mode: 'boolean' })
  overhideLedgerEnabled?: boolean = false;

  @attr({ mode: 'boolean' })
  overhideBitcoinEnabled?: boolean = false;

  @attr({ mode: 'boolean' })
  overhideSocialMicrosoftEnabled?: boolean = false;

  @attr({ mode: 'boolean' })
  overhideSocialGoogleEnabled?: boolean = false;

  @attr({ mode: 'boolean' })
  overhideOhledgerWeb3Enabled?: boolean = false;

  @attr({ mode: 'boolean' })
  overhideEthereumWeb3Enabled?: boolean = false;

  rootElement?: HTMLElement;
  envelopeElement?: HTMLElement;
  overhideSocialMicrosoftElement?: HTMLElement;
  overhideSocialGoogleElement?: HTMLElement;
  overhideOhledgerWeb3Element?: HTMLElement;
  overhideEthereumWeb3Element?: HTMLElement;
  overhideBitcoinElement?: HTMLElement;
  overhideLedgerElement?: HTMLElement;
  hub?: IOverhideHub; 
  opens: any[] = [];

  public constructor() {
    super(); 
  }

  // Open the login modal
  public open(): Promise<void> {
    if (this.rootElement) {
      this.rootElement.style.display = 'block';
      this.$emit('overhide-login-open');
      return new Promise<void>((resolve, reject) => {
        this.opens.push(resolve);
      });;      
    }
    return Promise.resolve();
  }

  // Close the login modal
  public close(): void {
    if (this.rootElement) {
      this.rootElement.style.display = 'none';
      this.$emit('overhide-login-close');
      this.opens.forEach(resolve => resolve());
      this.opens = [];
    }
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
      console.log(`WARNING: overhide-login configured for overhide-hub with ID ${newValue} but no element in DOM with this ID.`);
      return;
    }
    if (!el.THIS_IS_OVERHIDE_HUB) {
      console.log(`WARNING: overhide-login configured for overhide-hub with ID ${newValue} but element with this ID is not an overhide-hub element.`);
      return;
    }
    this.setHub(el);
  }

  connectedCallback() {
    super.connectedCallback();

    window.addEventListener('keydown', (event: any) => {
      if (event.key == 'Escape') {
        this.close();
      }
    });  
  };

  paymentInfoChanged(info: PaymentsInfo): void {
  }

  outsideClick(event: any) {
    if (event.target == this.envelopeElement) {
      this.close();
    }
  }
}
