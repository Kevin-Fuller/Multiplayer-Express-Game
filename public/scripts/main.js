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

function render() {
    // Clear the canvas before drawing the updated positions
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw a square for each user based on their current position
    for (const userId in currentRoom) {
        const user = currentRoom[userId];

        context.fillStyle = 'blue';
        context.fillRect(user.x, user.y, 15, 15);

        // Draw the username below the square
        context.fillStyle = 'black';
        context.font = '10px Arial';
        context.fillText(user.username, user.x, user.y + 20);

        context.fillText(user.state, user.x, user.y + 40);
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
