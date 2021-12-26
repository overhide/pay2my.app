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

Thus far we've covered user logins.  Let's get into making money as developers.

