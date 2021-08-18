export * from "./components/hub/component";
export * from "./components/hub/definitions";
export * from "./components/status/component";
export * from "./components/login/component";
export * from "./components/appsell/component";
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
//# sourceMappingURL=pay2my.app.d.ts.map