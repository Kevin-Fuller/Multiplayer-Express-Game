const socket = io();

const connectButton = document.getElementById("connect");
const usernameInput = document.getElementById('username');
let defaultRoom = "iceburg";





connectButton.addEventListener("click", () => {
    const username = usernameInput.value;
    const room = defaultRoom;

    if (username && room) {
        socket.emit("setUsername", { username, room });
    }
});


const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
const spriteSheet = new Image();
const penguinNoColor = new Image();
const penguinColor = new Image();
const penguinColorRed = new Image();
const penguinColorBlack = new Image();
penguinNoColor.src = 'images/penguinNoColor.png'; // Replace with the actual path
penguinColor.src = 'images/penguinColor.png'; // Replace with the actual path
penguinColorRed.src = 'images/penguinColorRed.png'; // Replace with the actual path
penguinColorBlack.src = 'images/penguinColorBlack.png'; // Replace with the actual path
spriteSheet.src = 'images/spritesheet.png'; // Replace with the actual path

let currentRoom;

let baseX = 800;
let baseY = 500;
let resizeX = 1600
let resizeY = 1000


function sizeCanvas(x, y) {
    const aspectRatio = baseX / baseY;
    let newWidth, newHeight;
    if (x / y > aspectRatio) {
        newWidth = y * aspectRatio;
        newHeight = y;
    } else {
        newWidth = x;
        newHeight = x / aspectRatio;
    }

// Set the canvas size
    canvas.width = newWidth;
    canvas.height = newHeight;

    // Update resizeX and resizeY
    resizeX = newWidth;
    resizeY = newHeight;

}

window.addEventListener("resize", ()=>{
    sizeCanvas((window.innerWidth * 0.8),(window.innerHeight * 0.8))
})

sizeCanvas((window.innerWidth * 0.8),(window.innerHeight * 0.8))

function convertToResize(x, y) {
    const xRatio = resizeX / baseX;
    const yRatio = resizeY / baseY;

    const resizeXPos = x * xRatio;
    const resizeYPos = y * yRatio;

    return { x: resizeXPos, y: resizeYPos };
}

function convertToResizeWidthHeight(width, height) {
    const xRatio = resizeX / baseX;
    const yRatio = resizeY / baseY;

    const resizeWidth = width * xRatio;
    const resizeHeight = height * yRatio;

    return { width: resizeWidth, height: resizeHeight };
}

function convertToBase(x, y) {
    const xRatio = resizeX / baseX;
    const yRatio = resizeY / baseY;

    const baseXPos = x / xRatio;
    const baseYPos = y / yRatio;

    return { x: baseXPos, y: baseYPos };
}


const frameWidth = 64;
const frameHeight = 64;


const characterSize = 58;


let furnitureInRoom = {};
let furnitureImages = {};


// Function to preload furniture spritesheets
function preloadFurnitureImages() {
    for (const furnitureId in furnitureInRoom) {
        const furniture = furnitureInRoom[furnitureId];
        const spritesheet = furniture.furnitureOptions.spritesheet;

        if (spritesheet && !furnitureImages[spritesheet]) {
            const img = new Image();
            img.src = spritesheet;
            furnitureImages[spritesheet] = img;
        }
    }
}

//this is a value used to give a little leeway before the character appears behind a prop.
const propAdjustment = 10


let isMapOpen = false;
import {drawMapButton, drawMap} from './map/map.js'

function render() {
    // Clear the canvas before drawing the updated positions
    context.clearRect(0, 0, canvas.width, canvas.height);
    // Preload furniture spritesheets
    preloadFurnitureImages();

    // Combine furniture and character data for sorting
    const renderObjects = [];

    // Add furniture to the renderObjects array
    for (const furnitureId in furnitureInRoom) {
        const furniture = furnitureInRoom[furnitureId];
        furniture.bottomY = furniture.y + furniture.furnitureOptions.height;

        renderObjects.push({
            type: "furniture",
            object: furniture,
        });
    }


    // Add characters to the renderObjects array
    for (const userId in currentRoom.users) {
        const user = currentRoom.users[userId];

        user.bottomY = user.y + propAdjustment;

        renderObjects.push({
            type: "character",
            object: user,
        });
    }



    // Sort renderObjects based on y-coordinates
    // Sort renderObjects based on y-coordinates and bottom of furniture
    renderObjects.sort((a, b) => {
        const bottomA = a.object.bottomY;
        const bottomB = b.object.bottomY;
        return bottomA - bottomB;
    });
    // Draw objects in sorted order
    for (const renderObject of renderObjects) {
        if (renderObject.type === "furniture") {
            const furniture = renderObject.object;
            const img = furnitureImages[furniture.furnitureOptions.spritesheet];
            const frameWidth = furniture.furnitureOptions.width;
            const frameHeight = furniture.furnitureOptions.height;
            const frameX = frameWidth * furniture.frame;

            const convertedWidthHeight = convertToResizeWidthHeight(frameWidth, frameHeight);
            const convertedXYResize = convertToResize( furniture.x, furniture.y)
            
            context.drawImage(
                img,
                frameX,
                0,
                frameWidth,
                frameHeight,
                convertedXYResize.x,
                convertedXYResize.y,
                convertedWidthHeight.width,
                convertedWidthHeight.height,
            );
        } else if (renderObject.type === "character") {
            const user = renderObject.object;
            // Draw a sprite for each user based on their current position and state
            const characterPositionX = convertToResize(user.x, user.y).x - (convertToResizeWidthHeight(characterSize,characterSize).width / 2);
            const characterPositionY = convertToResize(user.x, user.y).y - (convertToResizeWidthHeight(characterSize,characterSize).height - 10);
            let color;
            const frameNumber = user.currentFrame >= 0 ? user.currentFrame : -user.currentFrame;
            const spriteX = Math.abs(frameNumber) * frameWidth; // Adjust based on your sprite sheet
            const spriteY = 0; // Assuming all frames are in the first row
            switch (user.color) {
                case "red":
                    color = penguinColorRed;
                    break;
                case "black":
                    color = penguinColorBlack;
                    break;
                default:
                    color = penguinColor;
            }

            if (user.state) {
                context.save();
                if (user.currentFrame < 0) {
                    const spriteWidth = 64;

                    context.translate(characterPositionX + convertToResizeWidthHeight(characterSize,characterSize).width, characterPositionY);
                    context.scale(-1, 1);

                    const convertedWidthHeight = convertToResizeWidthHeight(spriteWidth, frameHeight);
                    const convertedXYResize = convertToResize( spriteX, spriteY)

                    context.drawImage(
                        color,
                        spriteX,
                        spriteY,
                        spriteWidth,
                        frameHeight,
                        0,
                        0,
                        convertToResizeWidthHeight(characterSize,characterSize).width,
                        convertToResizeWidthHeight(characterSize,characterSize).height
                    );
                    context.drawImage(
                        penguinNoColor,
                        spriteX,
                        spriteY,
                        spriteWidth,
                        frameHeight,
                        0,
                        0,
                        convertToResizeWidthHeight(characterSize,characterSize).width,
                        convertToResizeWidthHeight(characterSize,characterSize).height
                    );
                    if (user.clothes.head) {
                        const graphic = new Image();
                        graphic.src = user.clothes.head.spriteSheet;
                        context.drawImage(
                            graphic,
                            spriteX,
                            spriteY,
                            spriteWidth,
                            frameHeight,
                            0,
                            0,
                            convertToResizeWidthHeight(characterSize,characterSize).width,
                        convertToResizeWidthHeight(characterSize,characterSize).height
                        );
                    }
                    if (user.clothes.body) {
                        const graphic = new Image();
                        graphic.src = user.clothes.body.spriteSheet;
                        context.drawImage(
                            graphic,
                            spriteX,
                            spriteY,
                            spriteWidth,
                            frameHeight,
                            0,
                            0,
                            convertToResizeWidthHeight(characterSize,characterSize).width,
                        convertToResizeWidthHeight(characterSize,characterSize).height
                        );
                    }
                } else {
                    context.drawImage(
                        color,
                        spriteX,
                        spriteY,
                        frameWidth,
                        frameHeight,
                        characterPositionX,
                        characterPositionY,
                        convertToResizeWidthHeight(characterSize,characterSize).width,
                        convertToResizeWidthHeight(characterSize,characterSize).height
                    );
                    context.drawImage(
                        penguinNoColor,
                        spriteX,
                        spriteY,
                        frameWidth,
                        frameHeight,
                        characterPositionX,
                        characterPositionY,
                        convertToResizeWidthHeight(characterSize,characterSize).width,
                        convertToResizeWidthHeight(characterSize,characterSize).height
                    );
                    if (user.clothes.head) {
                        const graphic = new Image();
                        graphic.src = user.clothes.head.spriteSheet;
                        context.drawImage(
                            graphic,
                            spriteX,
                            spriteY,
                            frameWidth,
                            frameHeight,
                            characterPositionX,
                            characterPositionY,
                            convertToResizeWidthHeight(characterSize,characterSize).width,
                        convertToResizeWidthHeight(characterSize,characterSize).height
                        );
                    }
                    if (user.clothes.body) {
                        const graphic = new Image();
                        graphic.src = user.clothes.body.spriteSheet;
                        context.drawImage(
                            graphic,
                            spriteX,
                            spriteY,
                            frameWidth,
                            frameHeight,
                            characterPositionX,
                            characterPositionY,
                            convertToResizeWidthHeight(characterSize,characterSize).width,
                        convertToResizeWidthHeight(characterSize,characterSize).height
                        );
                    }
                }
                context.restore();

            } else {
                context.drawImage(
                    color,
                    spriteX,
                    spriteY,
                    frameWidth,
                    frameHeight,
                    characterPositionX,
                    characterPositionY,
                    convertToResizeWidthHeight(characterSize,characterSize).width,
                        convertToResizeWidthHeight(characterSize,characterSize).height
                );
                context.drawImage(
                    penguinNoColor,
                    spriteX,
                    spriteY,
                    frameWidth,
                    frameHeight,
                    characterPositionX,
                    characterPositionY,
                    convertToResizeWidthHeight(characterSize,characterSize).width,
                        convertToResizeWidthHeight(characterSize,characterSize).height
                );
            }



            // Draw the username below the sprite
            const centerTextX = characterPositionX + convertToResizeWidthHeight(characterSize,characterSize).width / 2;
            context.fillStyle = 'black';
            context.textAlign = "center";
            context.font = `${convertToResizeWidthHeight(10,10).width}px Arial`;
            context.fillText(user.username, centerTextX, characterPositionY + convertToResizeWidthHeight(10,60).height);
            context.fillText(user.state, centerTextX, characterPositionY +  convertToResizeWidthHeight(10,80).height);
            context.fillText(user.currentFrame, centerTextX, characterPositionY +  convertToResizeWidthHeight(10,100).height);

            // Draw messages above characters
            if (user.message) {
                // Draw speech bubble
                const bubbleWidth = context.measureText(user.message).width +  convertToResizeWidthHeight(10,60).width;
                const bubbleHeight =  convertToResizeWidthHeight(10,20).height;
                const bubbleX = characterPositionX + convertToResizeWidthHeight(characterSize,characterSize).width / 2 - bubbleWidth / 2;
                const bubbleY = characterPositionY - bubbleHeight -  convertToResizeWidthHeight(10,5).height;

                // Draw speech bubble background
                context.fillStyle = 'rgba(255, 255, 255, 0.8)';
                context.fillRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight);

                // Draw message text
                context.fillStyle = 'black';
                context.fillText(user.message, characterPositionX + convertToResizeWidthHeight(characterSize,characterSize).width / 2, bubbleY + bubbleHeight / 2);
            }
        }
    }
  
    drawMap(isMapOpen, context, canvas, convertToResizeWidthHeight(config.mapImage.width, config.mapImageHeight))
    drawMapButton(isMapOpen, isMouseOverMapButton, isMouseOverMapCloseButton, context, convertToResizeWidthHeight(config.closeButtonX, config.closeButtonY), convertToResizeWidthHeight(config.closeButtonWidthHeight, config.closeButtonWidthHeight))
  
}



// Event: Handle mouse click on the canvas
canvas.addEventListener('contextmenu', (event) => {
    const rect = canvas.getBoundingClientRect();
    const targetPosition = {
x: convertToBase(event.clientX - rect.left, event.clientY - rect.top).x,
        y: convertToBase(event.clientX - rect.left, event.clientY - rect.top).y
    };

    // Send the target position to the server
    socket.emit('move', targetPosition);

    event.preventDefault();
});

let isMouseOverMapButton = false;
let isMouseOverMapCloseButton = false;

import config from './helpers/config.js';

canvas.addEventListener("mousemove", (event) => {
    const mapButtonDistanceFromTopAndLeft = config.mapButtonDistanceFromTopAndLeft;
    const mapButtonWidth = config.mapButtonWidth;
    const mapButtonHeight = config.mapButtonHeight;


    const rect = canvas.getBoundingClientRect();
    const targetPosition = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
    const topLeftMapButton = { x: mapButtonDistanceFromTopAndLeft, y: mapButtonDistanceFromTopAndLeft };
    const bottomRightMapButton = { x: mapButtonDistanceFromTopAndLeft + mapButtonWidth, y: mapButtonDistanceFromTopAndLeft + mapButtonHeight };
    isMouseOverMapButton = checkIfOver(targetPosition.x, targetPosition.y, topLeftMapButton, bottomRightMapButton);


    const closeButtonResizeXY = convertToResizeWidthHeight(config.closeButtonX, config.closeButtonY);
    const closeButtonResizeWidthHeight = convertToResizeWidthHeight(config.closeButtonWidthHeight, config.closeButtonWidthHeight)
    const topLeftCloseButton = {x: closeButtonResizeXY.width, y: closeButtonResizeXY.height};
    const bottomRightCloseButton = {x: closeButtonResizeXY.width + closeButtonResizeWidthHeight.width, y: closeButtonResizeXY.height + closeButtonResizeWidthHeight.height};
    isMouseOverMapCloseButton = checkIfOver(targetPosition.x, targetPosition.y, topLeftCloseButton, bottomRightCloseButton)
});
function checkIfOver(x, y, topLeft, bottomRight) {
    return x >= topLeft.x && x <= bottomRight.x && y >= topLeft.y && y <= bottomRight.y;
}


const goToIceburgButton = document.getElementById("goToIceburg");
const goToPlazaButton = document.getElementById("goToPlaza");

function changeRoom(room) {
    socket.emit("changeRoom", room)
}

goToIceburgButton.addEventListener("click", () => {
    changeRoom("iceburg")
})

goToPlazaButton.addEventListener("click", () => {
    changeRoom("plaza")
})



socket.on("roomUpdate", (roomData) => {
    currentRoom = roomData;
    furnitureInRoom = roomData.furniture;

    // Update the canvas background based on roomData.src
    if (roomData.src) {
        canvas.style.background = `url(${roomData.src})`;
        canvas.style.backgroundSize = 'cover';
        canvas.style.backgroundPosition = "center";
    } else {
        // Set a default background if roomData.src is not provided
        canvas.style.background = 'url(default-background.jpg)';
        canvas.style.backgroundSize = 'cover';
        canvas.style.backgroundPosition = "center";
    }

    // Render the updated positions
    render();
});

// Event: Handle the addition of new users
socket.on("userAdded", (userId, userData) => {
    // Add the new user to the currentRoom object
    currentRoom.users[userId] = userData;

    // Render the updated positions
    render();
});


// Event: Handle mouse click on the canvas
canvas.addEventListener('click', (event) => {
    
    //check if clicking the map open button
    if(isMouseOverMapButton && !isMapOpen){
        isMapOpen = true;
    }

    //check if clicking the map close button
    if(isMouseOverMapCloseButton && isMapOpen){
        isMapOpen = false;
    }

    
});

// Event: Handle the removal of users
socket.on("userRemoved", (userId) => {
    // Remove the user from the currentRoom object
    delete currentRoom.users[userId];

    // Render the updated positions
    render();
});

const sendMessageInput = document.getElementById("sendMessage");

// Event: Handle key press in the input
sendMessageInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        // Get the message from the input
        const message = sendMessageInput.value.trim();

        // Check if the message is not empty
        if (message) {
            // Emit the message to the server
            socket.emit('sendMessage', message);

            // Clear the input
            sendMessageInput.value = '';
        }

        // Prevent the default behavior (line break in the input)
        event.preventDefault();
    }
});
