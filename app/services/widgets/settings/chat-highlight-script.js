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
  const { crlf, emotes, badges, username } = findDataElements(el);
  return {
    messageToPin: {
      tags: {
        badges,
        emotes,
        'display-name': username,
        id: '',
        'user-type': '',
        color: '',
      },
      crlf,
      prefix: '',
      command: 'PRIVMSG',
      params: [`#${username}`],
    },
  };
}

function findDataElements(el) {
  const ffzMessageEl = el.querySelector('.message');

  if (ffzMessageEl) {
    const username = el.attributes['data-user'].value;
    const { crlf, emotes } = parseMessage(ffzMessageEl.children);
    const badgesEl = el.querySelector('.chat-line__message--badges');
    const badges = Array.prototype.map
      .call(badgesEl.children, child => child?.attributes['data-badge']?.value)
      .join('/');
    return { badges, crlf, emotes, username };
  } else {
    return vanillaChatCrawl(el);
  }
}

function vanillaChatCrawl(el) {
  // Grab user's display name
  const usernameContainer = el.querySelector('.chat-line__username-container');
  const usernameEl = usernameContainer.querySelector('.chat-author__display-name');
  const username = usernameEl.attributes['data-a-user'].value;

  // Grab badges from username section
  const badgesContainer = usernameContainer.children[0];
  const badges = Array.prototype.map
    .call(badgesContainer.children, child => {
      const badgeEl = child.querySelector('.chat-badge');
      return badgeEl.attributes['alt'].value.toLowerCase();
    })
    .join('/');

  // Get and parse message content
  const messageContainer = el.querySelector("span[data-test-selector='chat-line-message-body']");
  const { crlf, emotes } = parseMessage(messageContainer.children);

  return { username, badges, crlf, emotes };
}

// Replicates emote id and position information gathered from Twitch IRC API
function parseEmoteString(child, startPos) {
  const emoteText = child.attributes['alt'].value;
  let emoteId;
  if (child.attributes['data-id']) {
    emoteId = child.attributes['data-id'].value;
  } else {
    const idRegex = /^https:\/\/static-cdn.jtvnw.net\/emoticons\/v2\/(\d+)/;
    const match = child.attributes['src'].value.match(idRegex);
    emoteId = match[1];
  }
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
      const bttvEmote = child.querySelector('.bttv-emote-image');
      if (bttvEmote) {
        currentMessageLength += bttvEmote.attributes['alt'].value.length;
        return bttvEmote.attributes['alt'].value;
      } else {
        currentMessageLength += child.innerText.length;
        return child.innerText;
      }
    }
    if (child.className.includes('chat-image')) {
      const { emoteText, parsedString } = parseEmoteString(child, currentMessageLength);
      emoteArray.push(parsedString);
      currentMessageLength += emoteText.length;
      return emoteText;
    }
    if (child.className === 'ffz--inline') {
      const ffzEmote = child.querySelector('.ffz-emote');
      console.log(ffzEmote);
      if (ffzEmote) {
        currentMessageLength += ffzEmote.attributes['alt'].value.length;
        return ffzEmote.attributes['alt'].value;
      } else {
        const { emoteText, parsedString } = parseEmoteString(
          child.children[0],
          currentMessageLength,
        );
        emoteArray.push(parsedString);
        currentMessageLength += emoteText.length;
        return emoteText;
      }
    }
    if (child.className === 'chat-line__message--emote-button') {
      const emoteEl = child.querySelector('.chat-line__message--emote');
      const { emoteText, parsedString } = parseEmoteString(emoteEl, currentMessageLength);
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
  unpinButton.innerHTML = 'Unpin Message';
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
  console.log('SLOBS - Initializing Observer');
  const interval = setInterval(addHighlightButtons, 1000);

  const unpinButton = document.getElementsByClassName('slobs-chat-highlight-unpin')[0];
  /* eslint-disable no-undef */
  streamlabsOBS.showUnpinButton(showUnpinButton => {
    /* eslint-enable no-undef */
    if (showUnpinButton) {
      unpinButton.style = 'opacity: 1;';
    } else {
      unpinButton.style = 'opacity: 0;';
    }
  });

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
    width: 22px;
    height: 22px;
    top: 0px;
    right: 44px;
    opacity: 0;
    padding: 4px;
    transition: 0.1s linear opacity;
    border-radius: 2px;
  }
  .fa-thumbtack {
    height: 70%;
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
    top: 20px;
    left: 50%;
    font-family: Roboto, sans-serif;
    text-align: center;
    font-weight: 600;
    transform: translate(-50%, -50%);
    border-radius: 4px;
    font-size: 14px;
    transition: 0.1s linear background-color;
  }
  .slobs-chat-highlight-unpin:hover {
    background-color: #31C3A2;
  }
  .chat-line__message {
    position: relative;
  }
  .chat-line__message:hover .slobs-chat-highlight-icon {
    opacity: 1;
    cursor: pointer;
  }
`);

console.log('SLOBS - Initiating Chat Highlight Script');
addHighlightButtons();
addUnpinButton();
setupObserver();

0;
