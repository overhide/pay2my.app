# Implement a Minimal Effort "Liberating" User Web-Login and In-App Purchases (IAP):  a How-To Tutorial Guide.

We will add a user login and in-app purchase (IAP) buttons to a Web product (basic HTML file).  We will do this using a couple w3c Web components from https://pay2my.app, some HTML, and some JavaScript.  We'll do this without a back-end, and then iteratively add the optional &mdash; but selectively valuable &mdash; back-end (sample Node.js).

The word "liberating" in the title of this tutorial is somewhat overloaded, on purpose:

- as a developer you're free to limit your application to front-end only, or leverage a back-end, yet enable user logins and make money regardless:  bring in a back-end for your features, not user management
- your customers have freedom to login into your product using social login, crypto wallets, or a secret passphrase they manage themselves
- as a developer you're freed from implementing payment-gateway integrations and user data-stores, just because you want to get paid for your offering
- as a developer you're free to focus on your app's functionality instead of worrying about GDPR and managing personable identifiable information, just to get paid for your efforts
- you're free to take this, own it, and modify it, protocols and code are free, open-sourced

The brunt of this article will be some very simple code -- we'll jump right into that.  This is very much a practical tutorial introducing how easy it is to use several standard w3c Web components to add user logins ("authenticate via signatures") and in-app purchases ("authorize via ledgers") to your Web offering.

But nothing needs to stay black-box.  I'll cover a high level explanation of what's going on behind the scenes at the end of the write-up, as an aside, for those interested.  There is nothing hidden or closed off here.  All the concepts of Ledger-Based Authorizations, the mechanisms, the APIs, the libraries, are documented in several blog posts, articles, slide shows, all available at https://pay2my.app.  The code backing what's discussed herein is open sourced and can be browsed at your leisure.  If something isn't top your liking, making it your way is a pull-request away, community agreeing of course.

There is no lock-in here.  

With that out of the way, let's look at some code.



## Basic User Login

The first code snippet we look at is a basic user login.  



> **</>**
>
>  [source on github](https://github.com/overhide/pay2my.app/blob/master/howto/code/1_first.html) | [rendered preview from github](https://overhide.github.io/pay2my.app/howto/code/1_first.html) 



Take a look at the full snippet of [raw source code on github](https://github.com/overhide/pay2my.app/blob/master/howto/code/1_first.html) to follow along.

We'll go through [this file](https://github.com/overhide/pay2my.app/blob/master/howto/code/1_first.html) focusing on the interesting bits and skipping boilerplate.

Starting with the [rendered page](https://overhide.github.io/pay2my.app/howto/code/1_first.html) in our browser we see something like the below:

![image-20211226135705577](C:\src\pay2my.app\howto\assets\image-20211226135705577.png)

These are the visual components we wired in with our HTML:

![code2ux](C:\src\pay2my.app\howto\assets\code2ux.png)

The [pay2myapp-status](https://github.com/overhide/pay2my.app#pay2myapp-status-) component specified on line 18 is what allows the user to login: change the "login" state of our user in our Web page.  

This component is usually put in the top-right corner of a Web page as part of some "navbar"; but here, it's our main interactive component for demonstration purposes.

A successful user login will manifest itself with the "❌ Not Authenticated" message &mdash; from the `#message` div on line 20 &mdash; changing to an "✔ Authenticated with .." message.

This change is specified on lines 26 through 32, as a reaction to a `pay2myapp-hub-sku-authentication-changed` DOM event:

```
26.     window.addEventListener('pay2myapp-hub-sku-authentication-changed',(e) => { 
27.       if (e.detail.isAuthenticated) {
28.         document.querySelector("#message").innerHTML = `✔ Authenticated with ${e.detail.imparter}`;
29.       } else {
30.         document.querySelector("#message").innerHTML = '❌ Not Authenticated';
31.       }
```

This event is raised to the DOM event listeners by the [pay2my.app](https://www.npmjs.com/package/pay2my.app) components in response to user actions &mdash; logging in and out via the widgets.

For example, on this page, when a user clicks on the "sign-in" text, they will be presented with a sign-in modal.  On a successful sign-in, the above `pay2myapp-hub-sku-authentication-changed`  DOM event is raised.

A sample "sign-in" flow using a generated secret token is shown below:

![uxworkflow](C:\src\pay2my.app\howto\assets\uxworkflow.PNG)

For subsequent sign-ins the user will need to remember this secret token &mdash; copy using the clipboard icon and store in some password manager.  Any new "generation" is effectively a new login.

The social login alternatives shown (Microsoft and Google) can be used to let users leverage their pre-existing Microsoft or Google accounts, to the same effect.  Feel free to try these out as well.  

> ℹ
>
> Note that using a new social login will automatically generate a secret token behind the scenes and use it to track transactions for that login.  The user need not remember their secret token, it's tracked on their behalf.  But the user is now dependent on their social login.



That was it for the login, but we jumped ahead to line 18 to discuss it.

Let's pedal back to line 5 and discuss some of the requisite wiring.



```
5.     <script src="https://cdn.jsdelivr.net/npm/pay2my.app@1.2.0/dist/pay2my.app.js"></script>
```

The interesting bit on line 5 is our pulling in of the [pay2my.app](https://www.npmjs.com/package/pay2my.app) node module from a CDN.  This module provides the w3c Web components we use for the user login widgets.



The first component we wire in is the "hub":

```
10.     <pay2myapp-hub id="demo-hub" apiKey="0x___API_KEY_ONLY_FOR_DEMOS_AND_TESTS___" isTest></pay2myapp-hub>     
```

On line 10 we add the [pay2myapp-hub](https://github.com/overhide/pay2my.app#pay2myapp-hub-) Web component into our DOM.  This is a non-visual component that ties our whole ecosystem of components together.  The "hub" brokers interaction of all the other components with the various open sourced [overhide services](https://github.com/overhide) as well as in-browser crypto wallets. It's the glue between the Web components and external services.

> ℹ
>
> In our demo we add Web components directly into the DOM of our simple HTML page, but all these low level Web components can just as well be wrapped by higher-level components of application frameworks such as [React](https://reactjs.org/): see [the React demos]().



We ID the "hub" component as a `demo-hub`.  We will use this ID to tie all the components into a single ecosystem controlled by this particular "hub" instance.  

This `id="demo-hub"` specification is optional.  Alternatively (to using HTML element IDs) the components can be wired together into an ecosystem programmatically with JavaScript (see ["Setting the pay2myapp-hub Programmatically" in the repo README](https://github.com/overhide/pay2my.app#setting-the-pay2myapp-hub-programatically) for more information).



The `apiKey` attribute indicates  who the system-using application is.  Each of your applications will use an `apiKey` as registered with the pay2my.app/overhide.io services at https://token.overhide.io/register.

The provided `apiKey` (`"0x___API_KEY_ONLY_FOR_DEMOS_AND_TESTS___"`) is a demo-only API key (for this here demo).  For your own applications you will replace this with your own API key(s) retrieved from https://token.overhide.io/register.

> **⚠**
>
> For a test instance (using fake money/testnets), such as this demo, ensure to generate a "Test only API key" at https://token.overhide.io/register.  

You don't need to understand the details of the `apiKey`, but if you want to, see ["Enabling with Token" in the repo README](https://github.com/overhide/pay2my.app#enabling-with-token) for more information.



Lastly, take special note of the `isTest` attribute above on line 10.  This indicates to the "hub" to use "test-net" services for its work.  Leaving this attribute out will use the various production/live services and ledgers, and real money.



The "hub" takes care of talking to external services and ledgers, acting as a glue between those and the various other components rendered.  The first component rendered on our page &mdash; albeit as a modal in reaction to clicks on other components &mdash; will be the [pay2myapp-login](https://github.com/overhide/pay2my.app#pay2myapp-login-) component:

```
12.     <pay2myapp-login hubId="demo-hub"
13.                     overhideSocialMicrosoftEnabled
14.                     overhideSocialGoogleEnabled
15.                     overhideSecretTokenEnabled>
16.     </pay2myapp-login>
```

This component is tied to our "hub" via the specified `hubId` attribute.

> ℹ
>
> Again, the `hubId` specification is optional and the components can be wired together into an ecosystem programmatically, see ["Setting the pay2myapp-hub Programmatically" in the repo README](https://github.com/overhide/pay2my.app#setting-the-pay2myapp-hub-programatically) for more information.

This "login" component specifies the various approaches to authentication and payments available to our application.

In this example we allow Microsoft social login, Google social login, and a user provided "secret token" (think password) for authentication.  All of this is setup via the three attributes on lines 13-15:

- overhideSocialMicrosoftEnabled
- overhideSocialGoogleEnabled
- overhideSecretTokenEnabled



With the "login" component setup, whenever a user attempts to authenticate , they will be present with a modal providing all three options:



## User Login via Button

In  the first example we provided a user login via the  [pay2myapp-status](https://github.com/overhide/pay2my.app#pay2myapp-status-) component.

This is a somewhat rigid component meant to be placed in a navbar.

In this example we do same, except with a button that can be [fully customized](https://github.com/overhide/pay2my.app#slots-2) via standard Web component `slots`.



> **</>**
>
>  [source on github](https://github.com/overhide/pay2my.app/blob/master/howto/code/2_button.html) | [rendered preview from github](https://overhide.github.io/pay2my.app/howto/code/2_button.html) 



Take a look at the full snippet of [raw source code on github](https://github.com/overhide/pay2my.app/blob/master/howto/code/2_button.html) to follow along.

The main difference here is the absence of the [pay2myapp-status](https://github.com/overhide/pay2my.app#pay2myapp-status-) component, being replaced by the [pay2myapp-appsell](https://github.com/overhide/pay2my.app#pay2myapp-appsell-) component on lines 18 through 21:

```
18.     <pay2myapp-appsell 
19.       hubId="demo-hub"         
20.       loginMessage="Login">
21.     </pay2myapp-appsell>
```

This component is more customizable, starting with the `loginMessage` attribute.  See the [component documentation](https://github.com/overhide/pay2my.app#pay2myapp-appsell-) for details.

The end result here is a button:

![image-20211226150515503](C:\src\pay2my.app\howto\assets\image-20211226150515503.png)

## In-App Purchases (IAP)

Thus far we've covered user logins.  

Let's get into making money as developers.

For this example we'll simply add a couple more attributes to the previously introduced [pay2myapp-appsell](https://github.com/overhide/pay2my.app#pay2myapp-appsell-) component.  

The full source code for this example:



> **</>**
>
>  [source on github](https://github.com/overhide/pay2my.app/blob/master/howto/code/3_purchases.html) | [rendered preview from github](https://overhide.github.io/pay2my.app/howto/code/3_purchases.html) 



Take a look at the full snippet of [raw source code on github](https://github.com/overhide/pay2my.app/blob/master/howto/code/3_purchases.html) to follow along.



As a quick aside, the basic premise of these in-app purchases is checking public ledgers for payments made from some obfuscated pseudonymous user owned token to your &mdash; the Web developers &mdash; public registered token.  The actual payments are made through https://stripe.com/ and tracked on the *overhide* public "receipts" ledger.  This is explained and covered ad nauseam in the various write-ups on the https://pay2my.app/ site.

> ℹ
>
> The user owned "token" is the secret token generated earlier.  The public "address" of this token is what's stored in the public ledger.  The private token is necessarily kept secret.
>
> For crypto currencies (later) the blockchain address and a signature are used, as furnished by wallets.  The blockchain is the public ledger.  



Back to the code, in this example we have both the "status" component and the "button".  The "button" is changed to become a paid-for up-sell:

```
20.     <pay2myapp-appsell 
21.       hubId="demo-hub" 
22.       sku="subscribed-feature"
23.       priceDollars="3"
24.       authorizedMessage="Use Feature"
25.       unauthorizedTemplate="Subscribe Feature For 2 Minutes ($${topup})"
26.       overhideAddress="0x046c88317b23dc57F6945Bf4140140f73c8FC80F"
27.       withinMinutes="2">
28.     </pay2myapp-appsell>
```



Let's unwind the "button" a bit before we click through a basic workflow.

On line 22 we're setting the features SKU as `subscribed-feature`.  We set the cost at $3 USD (line 23, `priceDollars` attribute) and set the feature to expire after two minutes of payment (`withinMinutes` attribute).  As such, in our example, a payment of $3 USD gives the user 2 minutes of usage.  

Keep in mind these are all fake USD payments in this demo, we're using testnets.



>  ℹ
>
> For a better picture of how these payments can be configured &mdash; free/paid/subscriptions &mdash; check out the [demos](https://github.com/overhide/pay2my.app#demos). 



Next, on line 26, we need to tell the widget which ledger "token" these payments are made to.  This is your &mdash; the developer's &mdash; payment address.  In the demo it's set to my test address, but you need to change this value as per whatever address you onboard (below).

The *overhide* ledger is just a receipts ledger.  The actual value transfer occurs through https://stripe.com &mdash; unlike cryptos whereby the value transfer occurs through the blockchain ledger (later).

> 📢
>
> Every single address used as a value in the `overhideAddress` attribute must be an *overhide* ledger [onboarded](https://test.ledger.overhide.io/onboard) address &mdash; whereby this address receives payment receipts of payments you receive on your https://stripe.com account.  



You onboard onto the *overhide* ledger as per the links at https://pay2my.app/:

- [testnet onboarding](https://test.ledger.overhide.io/onboard) (this demo)
- [live/prod onboarding](https://ledger.overhide.io/onboard) (when you're ready)



The onboarding process allows you to click through to https://stripe.com and create an account with them.  

For test purposes, when you're first getting into the swing of things, you can make-pretend onboard with https://stripe.com and skip the form-process.  But this is unavoidable once you want to get paid for real:

![image-20211226161152932](C:\src\pay2my.app\howto\assets\image-20211226161152932.png)





Moving past the button code, we also added handling of new DOM events.  The first one is the `pay2myapp-hub-sku-authorization-changed` and informs us when sufficient payments were made for a feature SKU:

```
44.     window.addEventListener('pay2myapp-hub-sku-authorization-changed',(e) => { 
45.       console.log(`pay2myapp-hub-sku-authorization-changed :: ${JSON.stringify(e.detail, null, 2)}`);
46.       if (e.detail.isAuthorized) {
47.         document.querySelector("#message").innerHTML = `✔ Authorized for SKU ${e.detail.sku}`;
48.       } else {
49.         document.querySelector("#message").innerHTML = '❌ Not Authorized';
50.       }
51.     });
```



The other event handler is for the `pay2myapp-appsell-sku-clicked` event, which tells us when the feature button was clicked:

```
53.     window.addEventListener('pay2myapp-appsell-sku-clicked',(e) => { 
54.       document.querySelector("#message").innerHTML = `⚙ Used feature with SKU ${e.detail.sku}`;
55.     });
```



On line 44 we have an authorizations `pay2myapp-hub-sku-authorization-changed` event indicating when we're authorized for a certain SKU.  You'll receive one such event for each configured sku, should the expected payments be met on the ledger:  hence the SKU be authorized.

In our case we just change the contents of the `#message` DIV.

Lastly, on line 53 we have the `pay2myapp-appsell-sku-clicked` event indicating an authorized button was clicked.  In our demo, our reaction to such a click is to once again change the contents of the `#message` DIV.



With the code understood, let's take a look at the experience.  

A user is presented with the following [rendered page](https://overhide.github.io/pay2my.app/howto/code/3_purchases.html):

![image-20211226155036584](C:\src\pay2my.app\howto\assets\image-20211226155036584.png)

Clicking on the "sign-in" blurb in the "status" widget or on the button will allow us to authenticate in the previous manner.

A click on the "status" widget will solely authenticate and pull down tallies of any existing ledger payments.

More interestingly, a click on the "button" will allow a top-up payment, presenting us with a credit card entry widget from https://stripe.com:



![image-20211226155604498](C:\src\pay2my.app\howto\assets\image-20211226155604498.png)



This is a make-belief payment using a fake VISA card, as such, the following values are entered (the `4242 4242 4242 4242` VISA number is mandatory)

- `foo@bar.com` for the email address
- `4242 4242 4242 4242` for the VISA number
- `05/55` for the expiry date
- `555` for the CVC



Once the payment is made, you will see a new message.   You can also click on the "token" in the "status" component to see your public ledger entries (orange arrow):

![refresh](C:\src\pay2my.app\howto\assets\refresh.png)

If you recall our payment is valid for 2 minutes.  Clicking the refresh button (green arrow) will demonstrate this.  No timers setup in this demo.



## Leveraging a Back-End

Thus far everything we did was in-browser only, no back-end code. 

This may be sufficient for your project and you may want to skip this section, but on the other hand, it may not be.  Consider [this write-up](https://overhide.io//2019/03/27/authorizations-and-exposed-source-code.html) to motivate your decision.

Note that you need to standup this back-end locally before the preview link below functions.



> **</>**
>
>  [source on github](https://github.com/overhide/pay2my.app/blob/master/howto/code/4_backend.html) |  [rendered preview from github](https://overhide.github.io/pay2my.app/howto/code/4_backend.html) (won't work until back-end running, see below)



First, some pre-requisites, a browser alone will no longer suffice.  

You will need [node.js](https://nodejs.org/en/download/) to run this particular sample back-end.  Follow the instructions at that link to install it.

You will also need a Web server to host the HTML snippet file to your browser; here we use `http-server` once `npm` is installed:

```
npm install -g http-server
```



We will not provide snippets of the back-end code in this write-up.  The simple [demo back-end source code](https://github.com/overhide/pay2my.app/tree/master/demo-back-end) lives in GitHub.  In fact it is the same back-end code running as Azure functions used for all the [code demos](https://www.npmjs.com/package/pay2my.app#demos) (at least the ones using a back-end).

It's pretty straight forward to get the back-end running locally ([source of truth instructions](https://github.com/overhide/pay2my.app#local-development)) and run this [HTML code snippet](https://github.com/overhide/pay2my.app/blob/master/howto/code/4_backend.html).

To get the back-end running...

- with the `https://github.com/overhide/pay2my.app` repository synced on your local machine
- with  [node.js](https://nodejs.org/en/download/) installed
- with `npm install -g http-server` installed
- with a console prompt in the `/demo-back-end` subfolder of the above repository

... simply start the back-end code:

```
npm install
npm run dev
```



The back-end will start at port `8100`.

Now, with the back-end humming on port `localhost:8100`, you can point your browser at the [rendered preview from github](https://overhide.github.io/pay2my.app/howto/code/4_backend.html) and see it work properly.



The preview shouldn't be anything new.  The value-add here is that the critical-path of your business flows goes through your back-end:  your feature click-through.

The important code changes start with the configuration of the "hub", it no longer receives an `apiKey`:

```
10.     <pay2myapp-hub id="demo-hub" isTest></pay2myapp-hub>      
```

Instead, the "hub" will receive an access token (to *overhide* services) from the back-end:

```
36.     BACKEND_CONNECTION_STRING = `http://localhost:8100`;
37. 
38.     // Set the token from back-end
39.     window.onload = (event) => {
40.     fetch(`${BACKEND_CONNECTION_STRING}/GetToken`)
41.       .then(async (response) => {
42.         if (response.ok) {
43.           const hub = document.querySelector('#demo-hub');
44.           hub.setAttribute('token', await response.text());
45.         } else {
46.           document.querySelector("#message").innerHTML = `error talking to back-end -- ${response.status} -- ${response.statusText}`;
47.         }
48.       }).catch(e => document.querySelector("#message").innerHTML = `error talking to back-end -- ${e}`);
49.     };
```

The back-end connection string is configured on line 36.

> ℹ
>
> If you'd like to try this demo snippet with this back-end code as it is currently running in Azure functions, simply change this `BACKEND_CONNECTION_STRING` to `https://demo-back-end.azurewebsites.net/api` and give the HTML file a try.

On line 40 we fetch the token and on line 44 we programmatically provide it to the "hub" component.



For back-end verifications of our feature click-throughs, we no have:

```
68.     window.addEventListener('pay2myapp-appsell-sku-clicked',(e) => { 
69.       // Call back-end and ensure it verifies before saying it's handled.
70.       fetch(`${BACKEND_CONNECTION_STRING}/RunFeature`
71.         +`?sku=${e.detail.sku}`
72.         +`&currency=${e.detail.currency}`
73.         +`&from=${e.detail.from}`
74.         +`&isTest=${e.detail.isTest}`
75.         +`&message=${btoa(e.detail.message)}`
76.         +`&signature=${btoa(e.detail.signature)}`)
77.         .then(response => {
78.           if (response.ok) {
79.             document.querySelector("#message").innerHTML = `⚙ Used feature with SKU ${e.detail.sku}`;
80.           } else {
81.             document.querySelector("#message").innerHTML = `error talking to back-end &mdash; ${response.status} &mdash; ${response.statusText}`;
82.           }
83.       }).catch(e => document.querySelector("#message").innerHTML = `error talking to back-end &mdash; ${e}`)
84.     });
```

The `pay2myapp-appsell-sku-clicked` event now goes to the back-end's `GET /RunFeature` endpoint (line 70).

This endpoint is served by a simple [node.js](https://nodejs.org/en/download/)/[express.js](https://expressjs.com/) router as coded in the back-end's [index.js](https://github.com/overhide/pay2my.app/blob/master/demo-back-end/index.js).

All those query parameters (lines 71 through 76) are documented in that route.

The `GET /RunFeature` ends up running the code [here](https://github.com/overhide/pay2my.app/blob/master/demo-back-end/RunFeature/index.js), which makes calls to several [*overhide* remuneration APIs](https://overhide.io/2020/09/06/remuneration-api.html) for authorization checks against ledgers used.



## Crypto In-App Purchases (IAP)
