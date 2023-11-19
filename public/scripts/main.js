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

let currentRoom;
let targetPositions = {};
let lastTimestamp;

function render() {
    // Clear the canvas before drawing the updated positions
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw a square for each user based on their target position
    for (const userId in currentRoom) {
        const user = currentRoom[userId];
        const targetPosition = targetPositions[userId] || { x: user.x, y: user.y }; // Use target position if available

        context.fillStyle = 'blue';
        context.fillRect(targetPosition.x, targetPosition.y, 15, 15);

        // Draw the username below the square
        context.fillStyle = 'black';
        context.font = '10px Arial';
        context.fillText(user.username, targetPosition.x, targetPosition.y + 20);
    }
}

// Event: Handle mouse click on the canvas
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const targetPosition = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };

    // Send the target position to the server
    socket.emit('move', targetPosition);
});

function animateMovement(userId, targetPosition, timestamp) {
    // Initialize target position if not present
    if (!targetPositions[userId]) {
        targetPositions[userId] = { ...currentRoom[userId] };
    }

    // Set the target position for animation
    targetPositions[userId].targetPosition = targetPosition;

    // Start the animation
    lastTimestamp = timestamp;
    requestAnimationFrame(() => {
        animateUser(userId);
    });
}

function animateUser(userId) {
    const user = targetPositions[userId];
    const targetPosition = user.targetPosition;

    // Calculate progress based on elapsed time
    const elapsed = performance.now() - lastTimestamp;
    const progress = Math.min(1, elapsed / 1000); // Limit progress to 1

    // Interpolate position based on progress
    user.x = user.x + (targetPosition.x - user.x) * progress;
    user.y = user.y + (targetPosition.y - user.y) * progress;

    // Render the updated positions
    render();

    // Continue the animation until reaching the target position
    if (progress < 1) {
        requestAnimationFrame(() => {
            animateUser(userId);
        });
    }
}

// Event: Handle mouse click on the canvas
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const targetPosition = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };

    // Send the target position to the server
    socket.emit('move', targetPosition);

    // Animate the movement
    animateMovement(socket.id, targetPosition, performance.now());
});

socket.on("roomUpdate", (roomData) => {
    currentRoom = roomData;

    // Update target positions
    for (const userId in currentRoom) {
        if (!targetPositions[userId]) {
            targetPositions[userId] = { ...currentRoom[userId] };
        } else {
            targetPositions[userId].x = currentRoom[userId].x;
            targetPositions[userId].y = currentRoom[userId].y;
        }
    }

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
