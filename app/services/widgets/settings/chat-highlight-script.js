function sendPinRequest(messageData) {
  // streamlabsOBS.pinMessage(messageData);
}

function extractProperties(el) {
  // const userColor = el.children.item(1).attributes.getNamedItem('style').value;
  const msgText = el.children.item(2).children.item(0).innerHTML;
  const badges = Array.prototype.map
    .call(el.children.item(0).children, child => child.attributes['data-badge'])
    .join('/');
  return {
    messageToPin: {
      tags: {
        badges,
        // color: userColor,
        'display-name': el.attributes['data-user'],
        emotes: '',
        id: '',
        'user-type': '',
      },
      prefix: '',
      command: 'PRIVMSG',
      params: [`#${el.attributes['data-user']}`],
      crlf: msgText,
    },
  };
}

function addHighlightButton(el) {
  if (el.firstElementChild.className.includes('live-message-separator-line__hr')) return;
  if (el.lastElementChild.className === 'slobs-chat-highlight-icon') return;
  console.log('SLOBS - Adding Highlight Button');
  const chatHighlight = document.createElement('i');
  chatHighlight.className = 'slobs-chat-highlight-icon';
  chatHighlight.innerHTML = getThumbtackSvg();
  chatHighlight.addEventListener('click', e => {
    sendPinRequest(extractProperties(el));
  });
  el.append(chatHighlight);
}

function addExistingHighlightButtons() {
  const els = document.getElementsByClassName('chat-line__message');
  Array.prototype.forEach.call(els, addHighlightButton);
}

function setupObserver() {
  const interval = setInterval(addExistingHighlightButtons, 1000);

  window.addEventListener('unload', () => clearInterval(interval));
}

function addStyle(styleString) {
  const style = document.createElement('style');
  document.head.append(style);
  style.textContent = styleString;
}

function getThumbtackSvg() {
  return `
    <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="thumbtack" class="svg-inline--fa fa-thumbtack fa-w-12" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
      <path fill="white" d="M298.028 214.267L285.793 96H328c13.255 0 24-10.745 24-24V24c0-13.255-10.745-24-24-24H56C42.745 0 32 10.745 32 24v48c0 13.255 10.745 24 24 24h42.207L85.972 214.267C37.465 236.82 0 277.261 0 328c0 13.255 10.745 24 24 24h136v104.007c0 1.242.289 2.467.845 3.578l24 48c2.941 5.882 11.364 5.893 14.311 0l24-48a8.008 8.008 0 0 0 .845-3.578V352h136c13.255 0 24-10.745 24-24-.001-51.183-37.983-91.42-85.973-113.733z"></path>
    </svg>
  `;
}

addStyle(`
  .slobs-chat-highlight-icon {
    position: absolute;
    background-color: #128079;
    width: 16px;
    height: 16px;
    top: 8px;
    right: 4px;
    opacity: 0;
    transition: 0.1s linear opacity;
    border-radius: 2px;
  }
  .slobs-chat-highlight-icon:hover {
    opacity: 1;
    cursor: pointer;
  }
  .fa-thumbtack {
    height: 80%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
`);

console.log('SLOBS - Initiating Chat Highlight Script');
addExistingHighlightButtons();
setupObserver();

0;
