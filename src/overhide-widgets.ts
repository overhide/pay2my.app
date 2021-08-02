import { OverhideHub } from "./components/hub/component";
import { OverhideStatus } from './components/status/component'
import { OverhideLogin } from './components/login/component'
import { OverhideAppsell } from './components/appsell/component'

OverhideHub;
OverhideStatus;
OverhideLogin
OverhideAppsell;

export * from "./components/hub/component";
export * from "./components/hub/definitions";
export * from "./components/status/component";
export * from "./components/login/component";
export * from "./components/appsell/component";

// For React w/TypeScript 
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'overhide-hub': any;
      'overhide-appsell': any;
      'overhide-status': any;
      'overhide-login': any;
    }
  }
}