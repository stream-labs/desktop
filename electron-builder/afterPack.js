const cp = require('child_process');
const fs = require('fs');

function signBinary(path) {
  console.log('Signing ' + path);
  cp.execSync(`codesign -s "Developer ID Application: Streamlabs LLC (UT675MBB9Q)" ${path}`);
}

exports.default = async function(context) {
  console.log('Updating dependency paths (requires sudo)');
  cp.execSync(`sudo install_name_tool -change ./node_modules/node-libuiohook/libuiohook.0.dylib @executable_path/../Resources/app.asar.unpacked/node_modules/node-libuiohook/libuiohook.0.dylib ${context.appOutDir}/Streamlabs\\ OBS.app/Contents/Resources/app.asar.unpacked/node_modules/node-libuiohook/node_libuiohook.node`);

  // TODO: Stop hardcoding
  signBinary('dist/mac/Streamlabs\\ OBS.app/Contents/Resources/app.asar.unpacked/node_modules/obs-studio-node/libobs-opengl.so');
  signBinary('dist/mac/Streamlabs\\ OBS.app/Contents/Resources/app.asar.unpacked/node_modules/obs-studio-node/obs-plugins/coreaudio-encoder.so');
  signBinary('dist/mac/Streamlabs\\ OBS.app/Contents/Resources/app.asar.unpacked/node_modules/obs-studio-node/obs-plugins/obs-transitions.so');
  signBinary('dist/mac/Streamlabs\\ OBS.app/Contents/Resources/app.asar.unpacked/node_modules/obs-studio-node/obs-plugins/image-source.so');
  signBinary('dist/mac/Streamlabs\\ OBS.app/Contents/Resources/app.asar.unpacked/node_modules/obs-studio-node/obs-plugins/obs-ffmpeg.so');
  signBinary('dist/mac/Streamlabs\\ OBS.app/Contents/Resources/app.asar.unpacked/node_modules/obs-studio-node/obs-plugins/mac-decklink.so');
  signBinary('dist/mac/Streamlabs\\ OBS.app/Contents/Resources/app.asar.unpacked/node_modules/obs-studio-node/obs-plugins/mac-vth264.so');
  signBinary('dist/mac/Streamlabs\\ OBS.app/Contents/Resources/app.asar.unpacked/node_modules/obs-studio-node/obs-plugins/rtmp-services.so');
  signBinary('dist/mac/Streamlabs\\ OBS.app/Contents/Resources/app.asar.unpacked/node_modules/obs-studio-node/obs-plugins/obs-browser.so');
  signBinary('dist/mac/Streamlabs\\ OBS.app/Contents/Resources/app.asar.unpacked/node_modules/obs-studio-node/obs-plugins/obs-x264.so');
  signBinary('dist/mac/Streamlabs\\ OBS.app/Contents/Resources/app.asar.unpacked/node_modules/obs-studio-node/obs-plugins/vlc-video.so');
  signBinary('dist/mac/Streamlabs\\ OBS.app/Contents/Resources/app.asar.unpacked/node_modules/obs-studio-node/obs-plugins/mac-avcapture.so');
  signBinary('dist/mac/Streamlabs\\ OBS.app/Contents/Resources/app.asar.unpacked/node_modules/obs-studio-node/obs-plugins/mac-capture.so');
  signBinary('dist/mac/Streamlabs\\ OBS.app/Contents/Resources/app.asar.unpacked/node_modules/obs-studio-node/obs-plugins/obs-outputs.so');
  signBinary('dist/mac/Streamlabs\\ OBS.app/Contents/Resources/app.asar.unpacked/node_modules/obs-studio-node/obs-plugins/obs-filters.so');
  signBinary('dist/mac/Streamlabs\\ OBS.app/Contents/Resources/app.asar.unpacked/node_modules/obs-studio-node/obs-plugins/mac-syphon.so');
  signBinary('dist/mac/Streamlabs\\ OBS.app/Contents/Resources/app.asar.unpacked/node_modules/obs-studio-node/obs-plugins/text-freetype2.so');
}
