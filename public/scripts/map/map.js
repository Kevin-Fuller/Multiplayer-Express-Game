import config from '../helpers/config.js';

function drawMapButton(isMapOpen, isMouseOverMapButton, isMouseOverCloseButton, context, closeButtonXY, closeButtonNewSize) {
    const mapButtonDistanceFromTopAndLeft = config.mapButtonDistanceFromTopAndLeft;
    const mapButtonWidth = config.mapButtonWidth;
    const mapButtonHeight = config.mapButtonHeight;
    const mapButtonHover = config.mapButtonHover;
    const mapButtonNormal = config.mapButtonNormal
    const mapCloseButton = config.closeButton
    const mapCloseButtonHover = config.closeButtonHover
    //if the map isnt open, draw the button
    if(!isMapOpen) {
        context.drawImage(mapButtonNormal, mapButtonDistanceFromTopAndLeft, mapButtonDistanceFromTopAndLeft, mapButtonWidth,  mapButtonHeight);
        if (!isMapOpen && isMouseOverMapButton) {
            context.drawImage(mapButtonHover, mapButtonDistanceFromTopAndLeft, mapButtonDistanceFromTopAndLeft, mapButtonWidth, mapButtonHeight);
        } else {
            context.drawImage(mapButtonNormal, mapButtonDistanceFromTopAndLeft, mapButtonDistanceFromTopAndLeft, mapButtonWidth, mapButtonHeight);
        }

    } else {
        if(isMouseOverCloseButton){
            context.drawImage(mapCloseButtonHover, closeButtonXY.width, closeButtonXY.height, closeButtonNewSize.width, closeButtonNewSize.height)
        } else {
            context.drawImage(mapCloseButton, closeButtonXY.width, closeButtonXY.height, closeButtonNewSize.width, closeButtonNewSize.height)
        }
    }
}
function drawMap(isMapOpen, context, canvas, adjustedMap) {
    if (isMapOpen) {
        const mapConfig = config

        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        const mapSizeWidth = adjustedMap.width / 2;
        const mapSizeHeight = adjustedMap.height / 2;

        // Calculate the position to center the map
        const mapX = (canvasWidth - mapSizeWidth) / 2;
        const mapY = (canvasHeight - mapSizeHeight) / 2;

        context.drawImage(mapConfig.mapImage, mapX, mapY, mapSizeWidth, mapSizeHeight);
    }
}





export {drawMapButton, drawMap};