const mapImage = new Image();
mapImage.src = 'images/map/mapImage.png'; // Replace with the actual path

// Placeholder images for the map button
const mapButtonNormal = new Image();
mapButtonNormal.src = 'images/map/mapButtonNormal.png'; // Replace with the actual path

const mapButtonHover = new Image();
mapButtonHover.src = 'images/map/mapButtonHover.png'; // Replace with the actual path

let mouseX = 0;
let mouseY = 0;

// Remove the duplicate declaration of isMapOpen
// let isMapOpen = false;

const closeButton = {
    x: 610, // Adjust the X position of the close button
    y: 85, // Adjust the Y position of the close button
    width: 20, // Adjust the width of the close button
    height: 20, // Adjust the height of the close button
    normalImage: new Image(),
    hoverImage: new Image(),
};

closeButton.normalImage.src = 'images/map/closeMapButton.png'; // Replace with the actual path
closeButton.hoverImage.src = 'images/map/closeMapButtonHover.png'; // Replace with the actual path

function drawCloseButton(context, isMapOpen) {
    const closeButtonX = closeButton.x;
    const closeButtonY = closeButton.y;

    // Draw the appropriate button image based on hover state
    context.drawImage(
        isMouseOverButton(closeButtonX, closeButtonY, closeButton.width, closeButton.height) ? closeButton.hoverImage : closeButton.normalImage,
        closeButtonX,
        closeButtonY,
        closeButton.width,
        closeButton.height
    );
}

function isMouseOverButton(x, y, width, height) {
    return (
        mouseX >= x &&
        mouseX <= x + width &&
        mouseY >= y &&
        mouseY <= y + height
    );
}

function handleButtonClick(x, y, width, height, callback, isMapOpen) {
    if (isMouseOverButton(x, y, width, height)) {
        callback(isMapOpen);
    }
}
function addMapListeners(canvas, openMapCallback, closeMapCallback, isMapOpen) {
    canvas.addEventListener('mousemove', (event) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = event.clientX - rect.left;
        mouseY = event.clientY - rect.top;
    });

    canvas.addEventListener('click', () => {
        if (isMapOpen) {
            handleButtonClick(closeButton.x, closeButton.y, closeButton.width, closeButton.height, closeMapCallback, isMapOpen);
        } else {
            handleButtonClick(10, 10, 50, 50, openMapCallback, isMapOpen);

        }
    });
}

function renderMap(context, canvas) {
    // Draw the map image
    // Adjust the scale of the map (e.g., make it half the size)
    const scaleFactor = 0.5;
    const mapWidth = mapImage.width * scaleFactor;
    const mapHeight = mapImage.height * scaleFactor;

    const centerX = (canvas.width - mapWidth) / 2;
    const centerY = (canvas.height - mapHeight) / 2;

    context.drawImage(mapImage, centerX, centerY, mapWidth, mapHeight);

    // Draw the close button
    drawCloseButton(context);
}

function drawMapButton(context) {
    const mapButtonX = 10; // Adjust the X-coordinate as needed
    const mapButtonY = 10; // Adjust the Y-coordinate as needed
    const mapButtonWidth = 50; // Adjust the width as needed
    const mapButtonHeight = 50; // Adjust the height as needed

    // Draw the appropriate button image based on hover state
    context.drawImage(
        isMouseOverButton(mapButtonX, mapButtonY, mapButtonWidth, mapButtonHeight) ? mapButtonHover : mapButtonNormal,
        mapButtonX,
        mapButtonY,
        mapButtonWidth,
        mapButtonHeight
    );
}

export { addMapListeners, renderMap, drawMapButton };
