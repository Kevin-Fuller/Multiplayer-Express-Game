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
    drawMapButton(
        isMapOpen, 
        isMouseOverMapButton, 
        isMouseOverMapCloseButton, 
        context, 
        convertToResizeWidthHeight(config.closeButtonX, config.closeButtonY), 
        convertToResizeWidthHeight(config.closeButtonWidthHeight, config.closeButtonWidthHeight),
        convertToResizeWidthHeight(config.openButtonX, config.openButtonY), 
        convertToResizeWidthHeight(config.openButtonWidthHeight, config.openButtonWidthHeight)
    )
  
}



// Event: Handle mouse click on the canvas
canvas.addEventListener('contextmenu', (event) => {
    const rect = canvas.getBoundingClientRect();
    const targetPosition = {
        x: convertToBase(event.clientX - rect.left, event.clientY - rect.top).x,
        y: convertToBase(event.clientX - rect.left, event.clientY - rect.top).y
    };

    // Send the target position to the server
    moveTo(targetPosition.x, targetPosition.y)

    event.preventDefault();
});

function moveTo(x, y) {
    socket.emit('move', {x: x, y: y});
}

let isMouseOverMapButton = false;
let isMouseOverMapCloseButton = false;

import config from './helpers/config.js';

canvas.addEventListener("mousemove", (event) => {
    const mapButtonDistanceFromTopAndLeft = config.mapButtonDistanceFromTopAndLeft;
    const mapButtonWidth = config.mapButtonWidth;
    const mapButtonHeight = config.mapButtonHeight;
    let cursorStyle = "default"


    const rect = canvas.getBoundingClientRect();
    const targetPosition = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };

    const openButtonResizeXY = convertToResizeWidthHeight(config.openButtonX, config.openButtonY)
    const openButtonResizeWidthHeight = convertToResizeWidthHeight(config.openButtonWidthHeight, config.openButtonWidthHeight)
    const topLeftMapButton = { x:openButtonResizeXY.width, y: openButtonResizeXY.height };
    const bottomRightMapButton = { x: openButtonResizeXY.width +  openButtonResizeWidthHeight.width, y:  openButtonResizeXY.height +  openButtonResizeWidthHeight.height };
    isMouseOverMapButton = checkIfOver(targetPosition.x, targetPosition.y, topLeftMapButton, bottomRightMapButton);
    if(isMouseOverMapButton && isMapOpen == false) {
        cursorStyle = "pointer";
    }


    const closeButtonResizeXY = convertToResizeWidthHeight(config.closeButtonX, config.closeButtonY);
    const closeButtonResizeWidthHeight = convertToResizeWidthHeight(config.closeButtonWidthHeight, config.closeButtonWidthHeight)
    const topLeftCloseButton = {x: closeButtonResizeXY.width, y: closeButtonResizeXY.height};
    const bottomRightCloseButton = {x: closeButtonResizeXY.width + closeButtonResizeWidthHeight.width, y: closeButtonResizeXY.height + closeButtonResizeWidthHeight.height};
    isMouseOverMapCloseButton = checkIfOver(targetPosition.x, targetPosition.y, topLeftCloseButton, bottomRightCloseButton)
    if(isMouseOverMapCloseButton && isMapOpen == true) {
        cursorStyle = "pointer";
    }


    mouseOverMapIcons.forEach(element => {
        const resizeXY = convertToResizeWidthHeight(element.topleftxy.x, element.topleftxy.y);
        const resizeWidthHeight =  convertToResizeWidthHeight(element.imageWidth, element.imageHeight);
        const topLeftButton = {x: resizeXY.width, y: resizeXY.height};
        const bottomRightButton = {x: resizeXY.width + resizeWidthHeight.width, y: resizeXY.height + resizeWidthHeight.height};
        element.mouseOver =  checkIfOver(targetPosition.x, targetPosition.y, topLeftButton, bottomRightButton)
        if(element.mouseOver && isMapOpen == true) {
            cursorStyle = "pointer";
        }
    });    
    canvas.style.cursor = cursorStyle;
});
function checkIfOver(x, y, topLeft, bottomRight) {
    return x >= topLeft.x && x <= bottomRight.x && y >= topLeft.y && y <= bottomRight.y;
}


function changeRoom(room) {
    socket.emit("changeRoom", room)
}

socket.on("test", (message)=>{
    console.log(message)
    changeRoom(message)
})

function connect4CheckPlayer(room, furniture) {
    socket.emit("checkIfPlayerExistsConnect4", {roomId: room, furniture: furniture});
}


socket.on("playerNumConnect4", (info)=> {
    if(info.trueFalse !== false) {
        moveTo(info.x, info.y)
    }
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

let mouseOverMapIcons = [
    {
        topleftxy: {x: 265, y: 240},
        imageWidth: 130,
        imageHeight: 55,
        imagesrc: "",
        mouseOver: false,
        goTo: "towncenter",
    },
    {
        topleftxy: {x: 550, y: 135},
        imageWidth: 65,
        imageHeight: 35,
        imagesrc: "",
        mouseOver: false,
        goTo: "iceburg"
    }
]



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

    if(isMapOpen){
        mouseOverMapIcons.forEach(icon =>{

            if(icon.mouseOver == true) {
                changeRoom(icon.goTo);
                isMapOpen = false;
            }
        })
    }

    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

     // Check if the click is within the bounds of any Connect4 furniture
     for (const furnitureId in furnitureInRoom) {
        const furniture = furnitureInRoom[furnitureId];

        if (
            furniture.furnitureOptions.trigger &&
            furniture.furnitureOptions.trigger.game &&
            furniture.furnitureOptions.trigger.game === "connect4"
        ) {
            const {x, y} = convertToResize(furniture.x, furniture.y);
            

            const width = furniture.furnitureOptions.width;
            const height = furniture.furnitureOptions.height;
            const {widthNew, heightNew} = convertToResizeWidthHeight(width, height)

            if (
                clickX >= x &&
                clickX <= x + width &&
                clickY >= y &&
                clickY <= y + height
            ) {
                connect4CheckPlayer(furniture.furnitureOptions.trigger.room, furniture)
                joinConnect4(furniture.furnitureOptions.trigger.room)
              
                
                // Add your logic here for handling the click on Connect4 furniture
                break; // Exit the loop if a Connect4 furniture is found
            }
        }
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

const connect4message = document.getElementById("connect4message")


function joinConnect4(room){
    socket.emit("joinConnect4Room", room);
    drawConnect4(emptyBoard)
}


const quitConnect4 = document.getElementById("quitConnect4Game")
quitConnect4.addEventListener("click", ()=>{
    socket.emit("quitConnect4", "room1")
    connect4GameWrapper.style.display = "none"
})

socket.on("connect4turn", (message)=>{
    connect4message.innerHTML = message
})


socket.on("connect4results", (message)=>{
    connect4message.innerHTML = message
})

function dropPiece(col) {
    socket.emit("dropconnect4", {column: col, roomId: "room1"});
}

socket.on("turnUpdateConnect4", (board)=>{
    drawConnect4(board)
})



socket.on("gameOverConnect4", (message) => {
    console.log(`winner ${message.winner}`);

    // Hide the buttons when the game is over
    const buttonRow = document.querySelector('.connect4-row-buttons');
    if (buttonRow) {
        buttonRow.style.display = 'none';
    }
});

const connect4Game = document.getElementById("connect4Game");
const gameUI = document.getElementById("game-ui-elements")
const connect4GameWrapper =  document.getElementById("connect4gamewrapper");


function drawConnect4(board) {
    connect4GameWrapper.style.display = "block"
    connect4Game.innerHTML = '';
    console.log(board)

    // Create a row for the buttons to drop pieces
    const buttonRow = document.createElement('div');
    buttonRow.className = 'connect4-row-buttons'; // Add a class for styling if needed

    // Loop through the columns to create buttons
    for (let col = 0; col < board[0].length; col++) {
        const button = document.createElement('button');
        button.classList.add("connect4buttondropper")
        button.innerHTML = `<div class="playerConnect4DropperButton"></div>`;
        button.addEventListener('click', () => dropPiece(col));
        buttonRow.appendChild(button);
    }

    // Append the button row to the connect4Game div
    connect4Game.appendChild(buttonRow);

    // Show the buttons if they were hidden in a previous game
    buttonRow.style.display = 'flex'; // Adjust the display property as needed

    // Loop through the rows of the board
    for (let row = 0; row < board.length; row++) {
        // Create a div element for each row
        const rowDiv = document.createElement('div');
        rowDiv.className = 'connect4-row'; // Add a class for styling if needed

        // Loop through the columns of the row
        for (let col = 0; col < board[row].length; col++) {
            // Create a div element for each cell
            const cell = document.createElement('div');

            // Set the size of each cell
            cell.style.width = '20px';
            cell.style.height = '20px';
            cell.style.borderRadius = '50%';
            cell.style.margin= "2px";

            // Set the background color based on the value in the board
            switch (board[row][col]) {
                case 0:
                    // Empty cell
                    cell.style.backgroundColor = 'var(--uicolor1)';
                    cell.style.border = "2px solid black";
                    break;
                case 1:
                    // Blue disc
                    cell.style.backgroundColor = 'blue';
                    cell.style.border = "2px solid black";
                    break;
                case 2:
                    // Red disc
                    cell.style.backgroundColor = 'red';
                    cell.style.border = "2px solid black";
                    break;
                default:
                    // Handle other values as needed
                    break;
            }

            // Append the cell to the row div
            rowDiv.appendChild(cell);
        }

        // Append the row div to the connect4Game div
        connect4Game.appendChild(rowDiv);
    }



}

const gameWindow = canvas;
const inventory = document.getElementById("connect4gamewrapper");
const grabBar = document.getElementById("connect4grabber");


let offset = [0,0];
let isDown = false;



grabBar.addEventListener("mousedown", (e)=>{
    isDown = true;
    grabBar.style.cursor = "grabbing"
    offset = [
        inventory.offsetLeft - e.clientX,
        inventory.offsetTop - e.clientY
    ];
})

grabBar.addEventListener("mouseup", ()=>{
    isDown = false;
    grabBar.style.cursor = "grab"
})


let mousePosition

document.addEventListener('mousemove', function(event) {
    event.preventDefault();
    if (isDown) {
        mousePosition = {
            x : event.clientX,
            y : event.clientY
        };
        if(mousePosition.x + offset[0] < 0){
            inventory.style.left = "0" + 'px';
        }else if (mousePosition.x + offset[0]+ inventory.offsetWidth > gameWindow.offsetWidth){
            let calcX = gameWindow.offsetWidth - inventory.offsetWidth;
            inventory.style.left = calcX + 'px';
        } else {
            inventory.style.left = (mousePosition.x + offset[0]) + 'px';
        }
        if(mousePosition.y + offset[1] < 0){
            inventory.style.top  = "0" + 'px';
        } 
        else if (mousePosition.y + offset[1]+ inventory.offsetHeight > gameWindow.offsetHeight){
            let calcY = gameWindow.offsetHeight - inventory.offsetHeight;
            inventory.style.top = calcY + 'px';
        } else {
            inventory.style.top  = (mousePosition.y + offset[1]) + 'px';
        }
    }
}, true);

// Example: Call the function with a sample board
const emptyBoard = [
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
];

// drawConnect4(sampleBoard);