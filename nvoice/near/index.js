// load images?

const href = window.location.href;
const params = new URLSearchParams(href.split('?')[1]);
const host = params.get('host') || 'http://localhost:3000';
const socket = io(host);

const image = document.getElementById('image');

let t;
function timer_set() {
  t = setTimeout(1000, () => {
    image.src = 'default.png';
    t = undefined;
  })
}
function timer_reset() {
  if (t) {
    clearTimeout(t);
    t = undefined;
  }
}

socket.on('phoneme', (phoneme) => {
  switch (phoneme) {
    case 'a':
      image.src = 'a.png';
      break;
    case 'i':
    case 'I':
      image.src = 'i.png';
      break;
    case 'u':
    case 'U':
    case 'w':
      image.src = 'u.png';
      break;
    case 'e':
      image.src = 'e.png';
      break;
    case 'o':
      image.src = 'o.png';
      break;
    case 'm':
    case 'p':
    case 'b':
      image.src = 'm.png';
      break;

    case 'silE':
      image.src = 'm.png';
      break;
  }
  timer_set();
});

