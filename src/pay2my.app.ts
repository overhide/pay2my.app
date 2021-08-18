import { Pay2MyAppHub } from "./components/hub/component";
import { Pay2MyAppStatus } from './components/status/component'
import { Pay2MyAppLogin } from './components/login/component'
import { Pay2MyAppSell } from './components/appsell/component'

Pay2MyAppHub;
Pay2MyAppStatus;
Pay2MyAppLogin
Pay2MyAppSell;

export * from "./components/hub/component";
export * from "./components/hub/definitions";
export * from "./components/status/component";
export * from "./components/login/component";
export * from "./components/appsell/component";

// For React w/TypeScript 
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'pay2myapp--hub': any;
      'pay2myapp--appsell': any;
      'pay2myapp--status': any;
      'pay2myapp--login': any;
    }
  }
}