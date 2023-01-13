const href = window.location.href;
const params = new URLSearchParams(href.split('?')[1]);
let socket;
try {
  const port = params.get('port');
  if (port && parseInt(port, 10) !== 0) {
    const host = `http://localhost:${port}`;
    // eslint-disable-next-line no-undef
    socket = io(host);
  } else {
    console.log('offline mode.');
  }
} catch (e) {
  console.log(e);
}

const debug = document.getElementById('debug'); // DEBUG時に使う用

const image = document.getElementById('image');
const eyes = document.getElementById('eyes');

let active = false;
function setActive(a) {
  if (active !== a) {
    active = a;
    if (socket) {
      socket.emit('active', active);
    }
  }
}

setActive(document.visibilityState === 'visible');
addEventListener('visibilitychange', () => {
  console.log('visibilitychange', document.visibilityState);
  setActive(document.visibilityState === 'visible');
});

const IMAGE_FILENAMES = {
  default: 'default.png',

  a: 'a.png',

  i: 'i.png',
  I: 'i.png',

  u: 'u.png',
  U: 'u.png',
  w: 'u.png',

  e: 'e.png',

  o: 'o.png',

  m: 'm.png',
  p: 'm.png',
  b: 'm.png',
  'silE': 'm.png',
};
const DEFAULT_COOL_TIME_MS = 1000;

let t;
function timer_set() {
  timer_reset();
  t = setTimeout(() => {
    image.src = IMAGE_FILENAMES.default;
    t = undefined;
  }, DEFAULT_COOL_TIME_MS);
}
function timer_reset() {
  if (t) {
    clearTimeout(t);
    t = undefined;
  }
}

if (socket) {
  socket.on('phoneme', (phoneme) => {
    if (!active) {
      return;
    }
    console.log('phoneme', phoneme);
    if (IMAGE_FILENAMES[phoneme]) {
      image.src = IMAGE_FILENAMES[phoneme];
    }
    timer_set();
  });
}

let blinkIndex = -1;
const blinkSequence = ['A', 'B', 'C', 'B', 'A'];
const BLINK_FRAME_MS = 100;
const BLINK_INTERVAL_MS = 5000;

setInterval(() => {
  if (active) {
    const blink = () => {
      const isDefault = image.src.endsWith('default.png');
      ++blinkIndex;
      if (blinkIndex < blinkSequence.length) {
        eyes.src = `SD_${isDefault ? 'default' : 'read'}_${blinkSequence[blinkIndex]}.png`;
        eyes.hidden = false;
        setTimeout(blink, BLINK_FRAME_MS);
      } else {
        eyes.hidden = true;
        blinkIndex = -1;
      }
    };
    setTimeout(blink, BLINK_FRAME_MS);
  }
}, BLINK_INTERVAL_MS);
