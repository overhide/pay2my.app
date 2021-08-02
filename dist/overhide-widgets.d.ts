export * from "./components/hub/component";
export * from "./components/hub/definitions";
export * from "./components/status/component";
export * from "./components/login/component";
export * from "./components/appsell/component";
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
//# sourceMappingURL=overhide-widgets.d.ts.map