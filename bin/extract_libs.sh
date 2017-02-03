NODE_OBS_DIR="./node_modules/node-obs/"
OBS_BUILD_DIR="${NODE_OBS_DIR}vendors/obs-studio_fork/build/"
PLUGIN_DIR="${OBS_BUILD_DIR}/plugins/"
LIB_DIR="./lib"

mkdir lib

cp ${PLUGIN_DIR}text-freetype2/text-freetype2.so ${LIB_DIR}
cp ${PLUGIN_DIR}rtmp-services/rtmp-services.so ${LIB_DIR}
cp ${PLUGIN_DIR}obs-x264/obs-x264.so ${LIB_DIR}
cp ${PLUGIN_DIR}obs-transitions/obs-transitions.so ${LIB_DIR}
cp ${PLUGIN_DIR}obs-outputs/obs-outputs.so ${LIB_DIR}
cp ${PLUGIN_DIR}obs-filters/obs-filters.so ${LIB_DIR}
cp ${PLUGIN_DIR}obs-ffmpeg/obs-ffmpeg.so ${LIB_DIR}
cp ${PLUGIN_DIR}mac-vth264/mac-vth264.so ${LIB_DIR}
cp ${PLUGIN_DIR}mac-syphon/mac-syphon.so ${LIB_DIR}
cp ${PLUGIN_DIR}decklink/mac/mac-decklink.so ${LIB_DIR}
cp ${PLUGIN_DIR}mac-capture/mac-capture.so ${LIB_DIR}
cp ${PLUGIN_DIR}mac-avcapture/mac-avcapture.so ${LIB_DIR}
cp ${PLUGIN_DIR}image-source/image-source.so ${LIB_DIR}
cp ${PLUGIN_DIR}coreaudio-encoder/coreaudio-encoder.so ${LIB_DIR}

cp ${OBS_BUILD_DIR}libobs-opengl/libobs-opengl.so ${LIB_DIR}
cp ${OBS_BUILD_DIR}deps/glad/libobsglad.0.dylib ${LIB_DIR}

cp -r ${OBS_BUILD_DIR}rundir/RelWithDebInfo/data .
