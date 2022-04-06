// Helper function called after our demo back-end returns successfully in reposnse to
// one of the upsell SKU buttons being clicked.
function addMessage(sku) {
  let message = `${new Date()} &mdash; <b>${sku}</b> used`;
  const messages = document.querySelector('#messages').innerHTML;
  const newMessage = `<div class="w3-panel w3-pale-green w3-display-container"><span onclick="this.parentElement.style.display='none'"
  class="w3-button w3-display-topright">X</span><p>${message}</p></div>` + messages;
  document.querySelector('#messages').innerHTML = newMessage;
}

// Helper function to add an error message.
function addError(text) {
  const messages = document.querySelector('#messages').innerHTML;
  const newMessage = `<div class="w3-panel w3-pale-red w3-display-container"><span onclick="this.parentElement.style.display='none'"
  class="w3-button w3-display-topright">X</span><p>${text}</p></div>` + messages;
  document.querySelector('#messages').innerHTML = newMessage;
}

window.addEventListener('pay2myapp-hub-sku-authentication-changed',(e) => { 
  console.log(`pay2myapp-hub-sku-authentication-changed :: ${JSON.stringify(e.detail, null, 2)}`);
});

window.addEventListener('pay2myapp-hub-sku-authorization-changed',(e) => { 
  console.log(`pay2myapp-hub-sku-authorization-changed :: ${JSON.stringify(e.detail, null, 2)}`);
});

// This event fires whenever we're asked to topup funds.
// We're using it here to show the VISA instructional helper image.
window.addEventListener('pay2myapp-hub-pending-transaction',(e) => { 
  console.log(`pending-transaction :: ${JSON.stringify(e.detail, null, 2)}`);
  if (e.detail.currency == 'dollars') {
    document.querySelector("#visa").style.opacity = e.detail.isPending ? "1" : "0";
  }
}, false);


