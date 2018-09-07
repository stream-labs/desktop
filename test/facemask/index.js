import test from 'ava';
import { useSpectron, focusMain, focusChild } from '../helpers/spectron/index';
import { addSource, clickRemoveSource, clickSourceProperties, selectSource } from '../helpers/spectron/sources';
import { addFilter, openFilterProperties, closeFilterProperties, removeFilter } from '../helpers/spectron/filters';
import { setFormInput, setFormDropdown, clickFormInput, setSliderPercent } from '../helpers/spectron/forms';
import { sleep } from '../helpers/sleep';


// ---------------------------------------------------------------------------
// receivedTestData : object to hold results from facemask plugin
var receivedTestData = {
  removeFilterTestCount : 0,
  faceDetectedCount : 0,
  faceNotDetectedCount : 0,
  numFacesDetected : 0,
  lastFaceX : 0,
  lastFaceY : 0,
  lastPixelR : 0,
  lastPixelG : 0,
  lastPixelB : 0,
  lastPixelA : 0
};


// ---------------------------------------------------------------------------
// parseTestData : parses info received from the facemask plugin
function parseTestData(d) {
  // remove filter test
  if (d.includes("stopping threads"))
    receivedTestData.removeFilterTestCount += 1;
  if (d.includes("threads stopped"))
    receivedTestData.removeFilterTestCount += 1;
  if (d.includes("filter destroyed"))
    receivedTestData.removeFilterTestCount += 1;

  // face detection tests
  if (d.includes("faces detected")) {
    var f = d.split(' ')[0];
    receivedTestData.numFacesDetected = parseInt(f);
    if (receivedTestData.numFacesDetected > 0)
      receivedTestData.faceDetectedCount += 1;
    else
      receivedTestData.faceNotDetectedCount += 1;
  }
  if (d.includes("face detected at")) {
    const ts = d.split(' ');
    var t = ts[ts.length  - 1];
    receivedTestData.lastFaceX = parseInt(t.split(',')[0]);
    receivedTestData.lastFaceY = parseInt(t.split(',')[1]);
  }
  if (d.includes("detected pixel")) {
    const ts = d.split(' ');
    var t = ts[ts.length  - 1];
    var color = t.split(',');
    receivedTestData.lastPixelR = parseInt(color[0]);
    receivedTestData.lastPixelG = parseInt(color[1]);
    receivedTestData.lastPixelB = parseInt(color[2]);
    receivedTestData.lastPixelA = parseInt(color[3]);
  }
}


// ---------------------------------------------------------------------------
// startTestPipeServer: create a net server to listen on a named pipe
//                      to receive test info from the facemask plugin
var testPipeServer = null;
async function startTestPipeServer() {
  // start a named pipe server
  var net = require('net');
  var PIPE_PATH = "\\\\.\\pipe\\SlobsTestPipe";

  if (testPipeServer == null) {
    testPipeServer = net.createServer(function(stream) {
      console.log("starting test pipe server");
      //stream.setNoDelay(true);
      stream.on('data', function(c) {
          parseTestData(c.toString());
      });
    });
    testPipeServer.listen(PIPE_PATH);
  }
}


// ---------------------------------------------------------------------------
// getFacemaskDataDir : Gets the path to the obs-facemask-plugin data dir
function getFacemaskDataDir() {
  var fs = require('fs');
  var path = require('path');

  // we are in test/facemask
  var dirString = path.dirname(fs.realpathSync(__filename));
  dirString = path.dirname(dirString);
  dirString = path.dirname(dirString);
  dirString += '\\face-mask\\';

  return dirString;
}


// ---------------------------------------------------------------------------
// addMediaSource : Create a Media Source and set it to play a video
async function addMediaSource(t, sourceName) {
  // create a media source
  await addSource(t, 'Media Source', sourceName, false);

  // what media
  var mediaFile = 'vidyo4_720p_60fps.webm';
  
  // set the source to an archive video
  await focusChild(t);
  var f = getFacemaskDataDir() + mediaFile;
  await setFormInput(t, 'Local File', f, 1);
  await clickFormInput(t, 'Loop');
  await focusChild(t);
  await t.context.app.client.click('button=Done');
}


// ---------------------------------------------------------------------------
// addImageSource : Create an Image Source and set it to an image
const IMAGE_ONEFACE = 1;
const IMAGE_MANYFACES = 2;
async function addImageSource(t, sourceName, which = IMAGE_ONEFACE) {
  // create a media source
  await addSource(t, 'Image', sourceName, false);

  // which image
  var imageFile = 'face.png';
  if (which == IMAGE_MANYFACES)
    imageFile = 'faces.png';

  // set the source to an archive video
  await focusChild(t);
  var f = getFacemaskDataDir() + imageFile;
  await setFormInput(t, 'Image File', f);
  await focusChild(t);
  await t.context.app.client.click('button=Done');
}


// ---------------------------------------------------------------------------
// addVideoCaptureDevice : Make a video capture device
async function addVideoCaptureDevice(t, sourceName) {
  // create a media source
  await addSource(t, 'Video Capture Device', sourceName, false);
}


// ---------------------------------------------------------------------------
// addFacemaskFilter : Add the face masks filter to a source
async function addFacemaskFilter(t, sourceName, filterName) {
  // add the facemask filter
  await focusMain(t);
  await addFilter(t, sourceName, 'Face Mask Plugin', filterName);

  // set some params
  await openFilterProperties(t, sourceName, filterName);
  await clickFormInput(t, 'Show Advanced Settings');
  await clickFormInput(t, 'Enable Testing Mode');
  await closeFilterProperties(t);
}

// ---------------------------------------------------------------------------
// setDetectionFull : disables face detection/tracking cropping 
async function setDetectionFull(t, sourceName, filterName) {
    // set some params
  await openFilterProperties(t, sourceName, filterName);
  await setSliderPercent(t, 'Face Detect Crop Width', 1);
  await setSliderPercent(t, 'Face Detect Crop Height', 1);
  await setSliderPercent(t, 'Face Detection Frequency', 0);
  await focusChild(t);
  await closeFilterProperties(t);
}

// ---------------------------------------------------------------------------
// setMaskImage
async function setMaskImage(t, sourceName, filterName, color) {
  // set some params
  await openFilterProperties(t, sourceName, filterName);
  var f = getFacemaskDataDir() + color + "dot.png";
  await focusChild(t);
  await setFormInput(t, 'Face Mask Image', f);
  await focusChild(t);
  await closeFilterProperties(t);
}

// ---------------------------------------------------------------------------
// setMaskJson
async function setMaskJson(t, sourceName, filterName, color) {
  // set some params
  await openFilterProperties(t, sourceName, filterName);
  var f = getFacemaskDataDir() + color + "sphere.json";
  await focusChild(t);
  await setFormInput(t, 'Mask', f);
  await focusChild(t);
  await closeFilterProperties(t);
}

// ---------------------------------------------------------------------------
// setMaskImage
async function setGlassesImage(t, sourceName, filterName, color) {
  // set some params
  await openFilterProperties(t, sourceName, filterName);
  var f = getFacemaskDataDir() + color + "dot.png";
  await focusChild(t);
  await setFormInput(t, 'Eye Glasses Image', f);
  await focusChild(t);
  await closeFilterProperties(t);
}

// ---------------------------------------------------------------------------
// setDrawMode
async function setDrawMode(t, sourceName, filterName, drawMode) {
  // set some params
  await openFilterProperties(t, sourceName, filterName);
  await focusChild(t);
  await setFormDropdown(t, 'Drawing Mode', drawMode);
  await focusChild(t);
  await closeFilterProperties(t);
}

// ---------------------------------------------------------------------------
// killSource: kill the source
async function killSource(t, sourceName) {
  await focusMain(t);
  await selectSource(t, sourceName);
  await clickRemoveSource(t);
}


// ---------------------------------------------------------------------------
// killFilter : kill the filter
async function killFilter(t, sourceName, filterName) {
  await focusMain(t);
  await removeFilter(t, sourceName, filterName);
}


// ---------------------------------------------------------------------------
// setFps60 : go into the settings and set video output to 60 fps
async function setFps60(t) {
    const app = t.context.app;

  // open settings
  await focusMain(t);
  await app.client.click('.top-nav .fa-cog');

  // video section
  await focusChild(t);
  await app.client.click('li=Video');

  // set fps to 60
  await focusChild(t);
  setFormDropdown(t, "Common FPS Values", "60");

  // yes, we need this, otherwise we close the window before
  // the dropdown is finishsed selecting.
  // 1 second is probably lots, but I'm going with 2
  await sleep(2000);

  // close settings
  await focusChild(t);
  await app.client.click('button=Done');
}


// ---------------------------------------------------------------------------
// updatePerformanceStats : updates performance statistics from the statsu bar
//                          includes cpu usage and fps
var cpuUsage = 0;
var fps = 0;
async function updatePerformanceStats(t) {
  // get the full status string
  await focusMain(t);
  const texts = await t.context.app.client.getText('div*=FPS');

  var text = texts[texts.length - 1];

  // parse out cpu usage
  var cputext = text.split('\n')[0];
  cputext = cputext.split(':')[1];
  cputext = cputext.split('%')[0];

  // parse out fps
  var fpstext = text.split('\n')[1];
  fpstext = fpstext.split(' ')[0];

  // convert and save
  cpuUsage = parseFloat(cputext);
  fps = parseFloat(fpstext);
}


// ---------------------------------------------------------------------------
// drawingModeTest : used for all the drawing tests
async function drawingModeTest(t, drawMode) {
    const sourceName = 'Example Source';
  const filterName = 'Example Filter';

  // start the test pipe server
  startTestPipeServer();

  // media source
  await addImageSource(t, sourceName);

  // facemask filter
  await addFacemaskFilter(t, sourceName, filterName);

  // set draw mode
  await setDrawMode(t, sourceName, filterName, drawMode);

  // tests
  var testColors = ["red", "green", "blue"];
  var testValues = [[255,0,0,255], [0,255,0,255], [0,0,255,255]];
  for(var i = 0; i < testColors.length; i++) {
    // set to color dot
    if (drawMode == '2D Face Mask')
      await setMaskImage(t, sourceName, filterName, testColors[i]);
    else
      await setMaskJson(t, sourceName, filterName, testColors[i]);
    await sleep(100);
    // check color at detected pixel
    const startTime = Date.now();
    while((Date.now() - startTime) < 3000) {
      if ((receivedTestData.lastPixelR != testValues[i][0]) ||
        (receivedTestData.lastPixelG != testValues[i][1]) ||
        (receivedTestData.lastPixelB != testValues[i][2]) ||
        (receivedTestData.lastPixelA != testValues[i][3])) {
          t.fail();
          break;
        }

      await sleep(10);
    }
  }
}



// ---------------------------------------------------------------------------
// ---------------------======= TESTS ======----------------------------------
// ---------------------------------------------------------------------------


// Turn Spectron On
useSpectron();


// ---------------------------------------------------------------------------
// TEST : Remove Filter
// ---------------------------------------------------------------------------
test('Remove Filter', async t => {
  const sourceName = 'Example Source';
  const filterName = 'Example Filter';

  // start the test pipe server
  startTestPipeServer();

  // media source
  await addMediaSource(t, sourceName);

  // facemask filter
  await addFacemaskFilter(t, sourceName, filterName);

  // kill the filter
  await killFilter(t, sourceName, filterName);

  // wait for data to arrive
  await sleep(1000);

  // we should have got 3 of these
  if (receivedTestData.removeFilterTestCount == 3)
    t.pass();
  else {
    console.log("Only received ", receivedTestData.removeFilterTestCount);
    t.fail();
  }
});


// ---------------------------------------------------------------------------
// TEST : Face Detection - Basic
// ---------------------------------------------------------------------------
test('Face Detection - Basic', async t => {
  const sourceName = 'Example Source';
  const filterName = 'Example Filter';

  // start the test pipe server
  startTestPipeServer();

  // media source
  await addImageSource(t, sourceName);

  // facemask filter
  await addFacemaskFilter(t, sourceName, filterName);

   // wait for data to arrive
  await sleep(1000);

  // run for a second (ish), check the face positions
  const startTime = Date.now();
  while((Date.now() - startTime) < 1000) {

    // be a little lax on the exact position
    if (receivedTestData.lastFaceX < 690 || (receivedTestData.lastFaceX > 710)
		|| (receivedTestData.lastFaceY < 325) || (receivedTestData.lastFaceY > 335)) {
			console.log("Wrong face X, Y : ", receivedTestData.lastFaceX, receivedTestData.lastFaceY);
			t.fail();
			break;
		}
  }

  // we should have detected kappa at least once by now
  if (receivedTestData.faceDetectedCount > 0)
    t.pass();
  else {
	console.log("Wrong Detected Face Number: : ", receivedTestData.faceDetectedCount );
	t.fail();
  }
});


// ---------------------------------------------------------------------------
// TEST : Face Detection - Advanced
// ---------------------------------------------------------------------------
test('Face Detection - Advanced', async t => {
  const sourceName = 'Example Source';
  const filterName = 'Example Filter';

  // start the test pipe server
  startTestPipeServer();

  // media source
  await addMediaSource(t, sourceName);

  // facemask filter
  await addFacemaskFilter(t, sourceName, filterName);
  await setDetectionFull(t, sourceName, filterName);

  // wait for a few seconds
  await sleep(60 * 1000);

  console.log("frames with faces:    ",  receivedTestData.faceDetectedCount);
  console.log("frames with no faces: ",  receivedTestData.faceNotDetectedCount);

  // get the percent of frames
  const total = receivedTestData.faceDetectedCount + receivedTestData.faceNotDetectedCount;
  var percent = receivedTestData.faceDetectedCount / total * 100;
  percent = percent.toFixed();

  console.log("We detected faces ", percent.toString(), "% of the time.");

  // for these videos, this is currently a pass
  if (percent > 95)
    t.pass();
  else
    t.fail();
});


// ---------------------------------------------------------------------------
// TEST : Performance
// ---------------------------------------------------------------------------
test('Performance', async t => {
  //TODO

  t.pass();
});


// ---------------------------------------------------------------------------
// TEST : Drawing : 2D Mask
// ---------------------------------------------------------------------------
test('Drawing : 2D Mask', async t => {

  // draw mode test
  //TODO

  t.pass();
});


// ---------------------------------------------------------------------------
// TEST : Drawing : JSON Mask
// ---------------------------------------------------------------------------
test('Drawing : Mask Json', async t => {

  // draw mode test
  //TODO

  t.pass();
});

