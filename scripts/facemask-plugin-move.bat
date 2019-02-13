IF EXIST .\\node_modules\\facemask-plugin\\NUL (
IF EXIST .\\node_modules\\obs-studio-node\\obs-plugins\\64bit\\facemask-plugin* del .\\node_modules\\obs-studio-node\\obs-plugins\\64bit\\facemask-plugin* 
IF EXIST .\\node_modules\\obs-studio-node\\data\\obs-plugins\\facemask-plugin\\NUL rmdir /s /Q .\\node_modules\\obs-studio-node\\data\\obs-plugins\\facemask-plugin
move .\\node_modules\\facemask-plugin\\slobs\\RelWithDebInfo\\obs-plugins\\* .\\node_modules\\obs-studio-node\\obs-plugins\\64bit 
move .\\node_modules\\facemask-plugin\\slobs\\RelWithDebInfo\\data\\obs-plugins\\facemask-plugin .\\node_modules\\obs-studio-node\\data\\obs-plugins 
rmdir /s /Q .\\node_modules\\facemask-plugin
ECHO Facemask Files Moved Successfully
)