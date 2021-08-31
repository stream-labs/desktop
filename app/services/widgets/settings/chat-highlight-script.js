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
  const slobsChatHightlightStyle = `
    position: absolute;
    background-color: red;
    width: 16px;
    height: 16px;
    top: 4px;
    right: 4px;
  `;
  const chatHighlight = document.createElement('i');
  chatHighlight.className = 'slobs-chat-highlight-icon';
  chatHighlight.setAttribute('style', slobsChatHightlightStyle);
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

console.log('SLOBS - Initiating Chat Highlight Script');
addExistingHighlightButtons();
setupObserver();

0;
