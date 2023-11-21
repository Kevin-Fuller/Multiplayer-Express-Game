// server.js

const { createServer } = require("http");
const { Server } = require("socket.io");
const express = require('express');
const walkingLogic = require('./scripts/player/walkingLogic'); // Import the walking logic file
const PORT = process.env.PORT || 3000;
const app = express();

const httpServer = createServer(app);
const io = new Server(httpServer, { /* options */ });

app.use(express.static('public'));

// rooms will store a list of users and their positions.
let rooms = {
    iceburg: {},
    plaza: {},
    igloo: {},
}

io.on("connection", (socket) => {
    console.log(`A new user connected: ${socket.id}`);
    console.log("Current users:");
    console.log(rooms);

    socket.on("setUsername", ({ username, room }) => {
        console.log(`A user set username: ${username} in room: ${room}`);

        // Check if the requested room exists
        if (!rooms[room]) {
            console.log(`Invalid room: ${room}`);
            return;
        }

        // Join the room before adding the user
        socket.join(room);

        // Add the user to the specified room
        rooms[room][socket.id] = {
            username,
            x: 350,
            y: 350,
            animationIntervalId: null, // Store the animation interval ID for each user
        };

        // Emit the room information to the user
        io.to(socket.id).emit("roomUpdate", rooms[room]);

        // Broadcast the addition of a new user to others in the room
        socket.to(room).emit("userAdded", socket.id, rooms[room][socket.id]);

        console.log("Updated rooms:", rooms);
    });

    // Use the handleMove function from the walking logic file
    socket.on("move", (targetPosition) => walkingLogic.handleMove(socket, targetPosition, rooms, io));

    // Event: Disconnect
socket.on("disconnect", function () {
    console.log('User disconnected');

    // Remove the user from the specified room
    for (const room in rooms) {
        if (rooms[room][socket.id]) {
            const user = rooms[room][socket.id];

            // Clear the animation interval when a user disconnects
            if (user.animationIntervalId) {
                clearInterval(user.animationIntervalId);
            }

            // Broadcast the removal of a user to others in the room
            socket.to(room).emit("userRemoved", socket.id);

            delete rooms[room][socket.id];

            // Emit the updated room information after a user disconnects
            io.to(room).emit("roomUpdate", rooms[room]);
        }
    }
});
});

// Server-side game loop with fixed time step
const serverTickRate = 1000 / 60; // 60 ticks per second


const animations = {
    walkingleft: [2, 10, 3, 10, 2, 9, 1, 9], // Example: frames 0 to 4 for walking animation
    walkingupleft: [3, 11, 11, 11, 3, 10, 10], // Example: frames 0 to 4 for walking animation
    walkingup: [4, 11, 3, 11, 4, -11, -3], // Example: frames 0 to 4 for walking animation
    walkingupright: [-3, -11, -11, -11, -3, -10, -10], // Example: frames 0 to 4 for walking animation
    walkingright: [-2, -10, -3, -10, -2, -9, -1, -9], // Example: frames 0 to 4 for walking animation
    walkingdownright: [-1, -9, -10, -9, -1, -8, -15, -8], // Example: frames 0 to 4 for walking animation
    walkingdown: [0, 8, 15, 8, 0, 14, -15, 14], // Example: frames 0 to 4 for walking animation
    walkingdownleft: [1, 9, 10, 9, 1, 8, 15, 8], // Example: frames 0 to 4 for walking animation
    idle: [0], // Example: frames 5 to 7 for idle animation
};

const framerate = 4;

setInterval(() => {
    for (const room in rooms) {
        for (const userId in rooms[room]) {
            const user = rooms[room][userId];
            if (user.animationTarget && user.animationCurrentStep < user.animationTotalSteps) {
                // Increment the animation step
                user.animationCurrentStep++;
                user.finalFrame = animations[user.state][0];

                // Update user position
                user.x += user.deltaX;
                user.y += user.deltaY;

                // Determine the current animation frame based on the user's state
                const animationFrames = animations[user.state];
                if(user.delayBetweenFrames == 0){
                    const currentFrame = animationFrames[(user.animationCurrentStep) % animationFrames.length];
                    user.currentFrame = currentFrame;
                    user.delayBetweenFrames = framerate;
                } else if (isNaN(user.delayBetweenFrames)) { // Corrected the comparison
                    user.delayBetweenFrames = framerate;
                    
                } else {
                    user.delayBetweenFrames = user.delayBetweenFrames - 1;
                }
            } else {
                // Set the state to "idle" when the user is not walking
                user.state = "idle";
                user.currentFrame = user.finalFrame;

                // Ensure the user reaches the exact target position when the animation is complete
                if (user.animationTarget) {
                    user.x = user.animationTarget.x;
                    user.y = user.animationTarget.y;
                }


            }
        }

        // Broadcast the updated positions to users in the same room
        io.to(room).emit("roomUpdate", rooms[room]);
    }

}, serverTickRate);

httpServer.listen(PORT, () => {
    console.log(`listening on port ${PORT}`)
});
