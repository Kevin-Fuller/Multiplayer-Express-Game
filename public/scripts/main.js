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
spriteSheet.src = 'images/spritesheet.png'; // Replace with the actual path

let currentRoom;



const frameWidth = 64;
const frameHeight = 64;

const visualFrameDuration = 100; // Time in milliseconds for rendering each frame visually
const animationFrameDuration = 100; // Time in ticks to update the animation frame
let lastRenderTime = 0;
let animationFrameCounter = 0;


const characterSize = 58;




function render() {
    // Clear the canvas before drawing the updated positions
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw a sprite for each user based on their current position and state
    for (const userId in currentRoom) {
        const user = currentRoom[userId];
        const characterPositionX = user.x - (characterSize/2)
        const characterPositionY = user.y - (characterSize - 10);

        if (user.state) {
            // Get the current frame from the walking animation
            const frameNumber = user.currentFrame >= 0 ? user.currentFrame : -user.currentFrame;

           

            // Calculate the position of the frame on the sprite sheet
            const spriteX = Math.abs(frameNumber) * frameWidth; // Adjust based on your sprite sheet
            const spriteY = 0; // Assuming all frames are in the first row

            // Save the current transformation matrix
            context.save();

            // Flip the image horizontally if delayBetweenFrames is negative
            if (user.currentFrame < 0) {
                const spriteWidth = 64;
                const numberOfSprites = spriteSheet.width / spriteWidth;

                // Translate and scale to flip the image horizontally
                context.translate(characterPositionX + characterSize, characterPositionY); // Adjusted translation

                context.scale(-1, 1);

                // Draw the sprite with the inverted sprite sheet
                context.drawImage(
                    spriteSheet,
                    spriteX,
                    spriteY,
                    spriteWidth,
                    frameHeight,
                    0, // Adjusted x-coordinate
                    0,
                    characterSize,
                    characterSize
                );

            } else {
                // Draw the sprite without flipping
                context.drawImage(spriteSheet, spriteX, spriteY, frameWidth, frameHeight, characterPositionX, characterPositionY, characterSize, characterSize);
            }

            // Restore the transformation matrix
            context.restore();
        } else {
            // Draw a default square for users in other states
            context.fillStyle = 'blue';
            context.fillRect(characterPositionX, characterPositionY, characterSize, characterSize);
        }

        // Draw the username below the sprite
        const centerTextX = (characterPositionX + (characterSize/2))
        context.fillStyle = 'black';
        context.textAlign = "center";
        context.font = '10px Arial';
        context.fillText(user.username, centerTextX, characterPositionY + 60);
        context.fillText(user.state, centerTextX, characterPositionY + 80);
        context.fillText(user.currentFrame, centerTextX, characterPositionY + 100);
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

socket.on("roomUpdate", (roomData) => {
    currentRoom = roomData;

    // Render the updated positions
    render();
});

// Event: Handle the addition of new users
socket.on("userAdded", (userId, userData) => {
    // Add the new user to the currentRoom object
    currentRoom[userId] = userData;

    // Render the updated positions
    render();
});




// Event: Handle the removal of users
socket.on("userRemoved", (userId) => {
    // Remove the user from the currentRoom object
    delete currentRoom[userId];

    // Render the updated positions
    render();
});


