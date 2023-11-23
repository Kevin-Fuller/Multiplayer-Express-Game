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



const frameWidth = 64;
const frameHeight = 64;

const visualFrameDuration = 100; // Time in milliseconds for rendering each frame visually
const animationFrameDuration = 100; // Time in ticks to update the animation frame
let lastRenderTime = 0;
let animationFrameCounter = 0;


const characterSize = 58;

function drawClothes() {
    if (user.clothes.head) {
        const graphic = new Image();
        graphic.src = user.clothes.head.spriteSheet;
        context.drawImage(
            graphic,
            spriteX,
            spriteY,
            spriteWidth,
            frameHeight,
            0, // Adjusted x-coordinate
            0,
            characterSize,
            characterSize
        );
    }
}


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


import { addMapListeners, renderMap, drawMapButton } from './map/map.js';


// ... (other variable declarations and imports)
let isMapOpen = false;
// Call this function to add event listeners for the map button
addMapListeners(canvas, () => {
    // Toggle the map state
    isMapOpen = !isMapOpen;
    // Handle map button click (e.g., open map, change room, etc.)
    console.log('Map button clicked!');
    console.log(isMapOpen)

    // Redraw the canvas
    render();
});



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
            
            context.drawImage(
                img,
                frameX,
                0,
                frameWidth,
                frameHeight,
                furniture.x,
                furniture.y,
                frameWidth,
                frameHeight
            );
        } else if (renderObject.type === "character") {
            const user = renderObject.object;
            // Draw a sprite for each user based on their current position and state
            const characterPositionX = user.x - (characterSize / 2);
            const characterPositionY = user.y - (characterSize - 10);
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

                    context.translate(characterPositionX + characterSize, characterPositionY);
                    context.scale(-1, 1);

                    context.drawImage(
                        color,
                        spriteX,
                        spriteY,
                        spriteWidth,
                        frameHeight,
                        0,
                        0,
                        characterSize,
                        characterSize
                    );
                    context.drawImage(
                        penguinNoColor,
                        spriteX,
                        spriteY,
                        spriteWidth,
                        frameHeight,
                        0,
                        0,
                        characterSize,
                        characterSize
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
                            characterSize,
                            characterSize
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
                            characterSize,
                            characterSize
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
                        characterSize,
                        characterSize
                    );
                    context.drawImage(
                        penguinNoColor,
                        spriteX,
                        spriteY,
                        frameWidth,
                        frameHeight,
                        characterPositionX,
                        characterPositionY,
                        characterSize,
                        characterSize
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
                            characterSize,
                            characterSize
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
                            characterSize,
                            characterSize
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
                    characterSize,
                    characterSize
                );
                context.drawImage(
                    penguinNoColor,
                    spriteX,
                    spriteY,
                    frameWidth,
                    frameHeight,
                    characterPositionX,
                    characterPositionY,
                    characterSize,
                    characterSize
                );
            }



            // Draw the username below the sprite
            const centerTextX = characterPositionX + characterSize / 2;
            context.fillStyle = 'black';
            context.textAlign = "center";
            context.font = '10px Arial';
            context.fillText(user.username, centerTextX, characterPositionY + 60);
            context.fillText(user.state, centerTextX, characterPositionY + 80);
            context.fillText(user.currentFrame, centerTextX, characterPositionY + 100);

            // Draw messages above characters
            if (user.message) {
                // Draw speech bubble
                const bubbleWidth = context.measureText(user.message).width + 10;
                const bubbleHeight = 20;
                const bubbleX = characterPositionX + characterSize / 2 - bubbleWidth / 2;
                const bubbleY = characterPositionY - bubbleHeight - 5;

                // Draw speech bubble background
                context.fillStyle = 'rgba(255, 255, 255, 0.8)';
                context.fillRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight);

                // Draw message text
                context.fillStyle = 'black';
                context.fillText(user.message, characterPositionX + characterSize / 2, bubbleY + bubbleHeight / 2);
            }
        }
    }
    if (isMapOpen) {
        // Draw the map
        renderMap(context, canvas);
    } else {
        // Draw the map button
        drawMapButton(context);
    }
}



// Event: Handle mouse click on the canvas
canvas.addEventListener('contextmenu', (event) => {
    const rect = canvas.getBoundingClientRect();
    const targetPosition = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };

    // Send the target position to the server
    socket.emit('move', targetPosition);

    event.preventDefault();
});

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
    const targetPosition = {
        x: event.clientX,
        y: event.clientY 
    };

    console.log(targetPosition)
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
