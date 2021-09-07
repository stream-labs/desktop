// Sends relevant data to the SLOBS ChatHighlightService
function sendPinRequest(messageData) {
  console.log('SLOBS - Sending Pin Request', messageData);
  streamlabsOBS.pinMessage(messageData); // eslint-disable-line no-undef
}

// Sends relevant data to the SLOBS ChatHighlightService
function sendUnpinRequest() {
  console.log('SLOBS - Sending Unpin Request');
  streamlabsOBS.unpinMessage(); // eslint-disable-line no-undef
}

// Reshapes DOM elements into JSON-friendly structure for the SL API to ingest
function extractProperties(el) {
  const userName = Array.prototype.find.call(el.children, child =>
    child.className.includes('chat-line__username'),
  );
  const color = userName.attributes['style'].value;
  const message = Array.prototype.find.call(el.children, child => child.className === 'message  ')
    .children;
  const { crlf, emotes } = parseMessage(message);
  const badges = Array.prototype.map
    .call(el.children.item(1).children, child => child.attributes['data-badge'].value)
    .join('/');
  return {
    messageToPin: {
      tags: {
        badges,
        color,
        emotes,
        'display-name': el.attributes['data-user'].value,
        id: '',
        'user-type': '',
      },
      crlf,
      prefix: '',
      command: 'PRIVMSG',
      params: [`#${el.attributes['data-user'].value}`],
    },
  };
}

// Replicates emote id and position information gathered from Twitch IRC API
function parseEmoteString(child, startPos) {
  const emoteText = child.attributes['alt'].value;
  const emoteId = child.attributes['data-id'].value;
  const endPos = startPos + emoteText.length - 1;

  return { emoteText, parsedString: `${emoteId}:${startPos}-${endPos}` };
}

// Extracts emotes from message text and returns emote information as well as the entire text string
// including emotes
function parseMessage(children) {
  const emoteArray = [];
  let currentMessageLength = 0;

  const rawTextArray = Array.prototype.map.call(children, (child, i) => {
    if (child.className === 'text-fragment') {
      currentMessageLength += child.innerHTML.length;
      return child.innerHTML;
    }
    if (child.className.includes('chat-image')) {
      const { emoteText, parsedString } = parseEmoteString(child, currentMessageLength + 1);
      emoteArray.push(parsedString);
      currentMessageLength += emoteText.length;
      return emoteText;
    }
    if (child.className === 'ffz--inline') {
      const { emoteText, parsedString } = parseEmoteString(
        child.children[0],
        currentMessageLength + 1,
      );
      emoteArray.push(parsedString);
      currentMessageLength += emoteText.length;
      return emoteText;
    }
  });

  return { crlf: rawTextArray.join(''), emotes: emoteArray.join('/') };
}

// Adds an Unpin button to the header when there is a pinned chat message
function addUnpinButton() {
  console.log('SLOBS - Adding Unpin Button');
  const parentEl = document.getElementsByClassName('stream-chat-header')[0];
  const unpinButton = document.createElement('button');
  unpinButton.className = 'slobs-chat-highlight-unpin';
  unpinButton.style = 'opacity: 0;';
  unpinButton.innerText = 'Unpin Message';
  unpinButton.addEventListener('click', sendUnpinRequest);
  parentEl.append(unpinButton);
}

// Adds a highlight button to relevant chat messages if one doesn't exist
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

// Adds a highlight button to all chat messages
function addHighlightButtons() {
  const els = document.getElementsByClassName('chat-line__message');
  Array.prototype.forEach.call(els, addHighlightButton);
}

// Sets interval to add pin button to new chat messages and toggle visibility of the Unpin button
function setupObserver() {
  const interval = setInterval(() => {
    addHighlightButtons();

    const unpinButton = document.getElementsByClassName('slobs-chat-highlight-unpin')[0];
    /* eslint-disable no-undef */
    streamlabsOBS.showUnpinButton().then(showUnpinButton => {
      /* eslint-enable no-undef */
      if (showUnpinButton) {
        unpinButton.style = 'opacity: 1;';
      } else {
        unpinButton.style = 'opacity: 0;';
      }
    });
  }, 1000);

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
    width: 18px;
    height: 18px;
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
  .slobs-chat-highlight-unpin {
    width: 80%;
    height: 40px;
    background-color: #128079;
    color: white;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-radius: 4px;
  }
`);

console.log('SLOBS - Initiating Chat Highlight Script');
addHighlightButtons();
addUnpinButton();
setupObserver();

0;
