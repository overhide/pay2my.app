// Helper function called after our demo back-end returns successfully in reposnse to
// one of the upsell SKU buttons being clicked.
function addMessage(sku) {
  let message = null;

  switch (sku) {
    case 'free-feature':
      message = `${new Date()} &mdash; <b>free</b> feature used`;
      break;
    case 'paid-feature':
      message = `${new Date()} &mdash; <b>paid</b> feature used`;
      break;
    case 'subscribed-feature':
      message = `${new Date()} &mdash; <b>subscribed</b> feature used`;
      break;
  }

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

// This is where we listen to authorized users clicking on events when they click a feature button.
// We hit the back-end in response to these.
// We re-validate authorizations in the back-end.
// See /demo-back-end
window.addEventListener('overhide-appsell-sku-clicked',(e) => { 
  console.log(`sku-clicked :: ${JSON.stringify(e.detail, null, 2)}`);
  
  if (BACKEND_CONNECTION_STRING === `NONE`) {
    // No back-end version, handle in front-end only
    addMessage(e.detail.sku);  
    return;
  }

  // Call back-end and ensure it verifies before saying it's handled.
  fetch(`${BACKEND_CONNECTION_STRING}/RunFeature`
    +`?sku=${e.detail.sku}`
    +`&currency=${e.detail.currency}`
    +`&from=${e.detail.from}`
    +`&isTest=${e.detail.isTest}`
    +`&message=${btoa(e.detail.message)}`
    +`&signature=${btoa(e.detail.signature)}`)
    .then(response => {
      if (response.ok) {
        addMessage(e.detail.sku);
      } else {
        addError(`error talking to back-end &mdash; ${response.status} &mdash; ${response.statusText}`);
      }
  }).catch(e => addError(`error talking to back-end &mdash; ${e}`))
}, false);

// This event fires whenever we're asked to topup funds.
// We're using it here to show the VISA instructional helper image.
window.addEventListener('overhide-hub-pending-transaction',(e) => { 
  console.log(`pending-transaction :: ${JSON.stringify(e.detail, null, 2)}`);
  if (e.detail.currency == 'dollars') {
    document.querySelector("#visa").style.opacity = e.detail.isPending ? "1" : "0";
  }
}, false);


