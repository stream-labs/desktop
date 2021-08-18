function sendPinRequest(messageData) {
  // streamlabsOBS.pinMessage(messageData);
}

function extractProperties(el) {
  const userColor = el.children.item(1).attributes.getNamedItem('style').value;
  const msgText = el.children.item(2).children.item(0).innerHTML;
  const badges = Array.prototype.map
    .call(el.children.item(0).children, child => child.attributes['data-badge'])
    .join('/');
  return {
    messageToPin: {
      tags: {
        badges,
        color: userColor,
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

const chatHightlightStyle = `
  position: absolute;
  background-color: red;
  width: 16px;
  height: 16px;
  top: 0;
  right: 0;
`;

function addHighlightButton(el) {
  const chatHighlight = document.createElement('i');
  chatHighlight.className = 'chat-highlight-icon';
  chatHighlight.setAttribute('style', chatHightlightStyle);
  chatHighlight.addEventListener('click', e => {
    sendPinRequest(extractProperties(el));
  });
  el.append(chatHighlight);
}

function addExistingHighlightButtons() {
  const els = document.getElementsByClassName('chat-line__message');
  Array.prototype.forEach.call(els, addHighlightButton);
  console.log(els);
}

function addNewHighlightButton(mutationsList) {
  mutationsList.forEach(mutation => {
    if (mutation.type === 'childList' && mutation.addedNodes.length) {
      addHighlightButton(mutation.target);
    }
  });
}

addExistingHighlightButtons();
const targetNode = document.getElementsByClassName('chat-scrollable-area__message-container')[0];
console.log(targetNode);

const observer = new MutationObserver(addNewHighlightButton);
observer.observe(targetNode, { childList: true });
0;
