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


const furnitureOptions = {
    christmasTree: {
        name: "christmas tree",
        spritesheet: "images/furniture/christmastree.png",
        width: 62.5,
        height: 100,
        animation: false,
        floor: false
    }
}

// rooms will store a list of users and their positions.
let rooms = {
    iceburg: {
        src: "https://2.bp.blogspot.com/-Px0gsWsoTM4/TvXL2qxOOAI/AAAAAAAABoI/KtE9U51XRhw/s1600/tree+1.bmp",
        startingX: 300,
        startingY: 250,
        furniture: [
            {
                type: "christmasTree",
                x: 300, // Adjust the x-coordinate based on your preference
                y: 200, // Adjust the y-coordinate based on your preference
                frame: 2,
                furnitureOptions: furnitureOptions["christmasTree"],
            },
            {
                type: "christmasTree",
                x: 250, // Adjust the x-coordinate based on your preference
                y: 220, // Adjust the y-coordinate based on your preference
                frame: 1,
                furnitureOptions: furnitureOptions["christmasTree"],
            },
            {
                type: "christmasTree",
                x: 330, // Adjust the x-coordinate based on your preference
                y: 250, // Adjust the y-coordinate based on your preference
                frame: 3,
                furnitureOptions: furnitureOptions["christmasTree"],
            },
            {
                type: "christmasTree",
                x: 500, // Adjust the x-coordinate based on your preference
                y: 220, // Adjust the y-coordinate based on your preference
                frame: 0,
                furnitureOptions: furnitureOptions["christmasTree"],
            },
            {
                type: "christmasTree",
                x: 400, // Adjust the x-coordinate based on your preference
                y: 210, // Adjust the y-coordinate based on your preference
                frame: 0,
                furnitureOptions: furnitureOptions["christmasTree"],
            },
            // Add more furniture as needed
        ],
        users: {}
    },
    plaza: {src: "https://pbs.twimg.com/media/E9mVH28XsAIyG6F?format=jpg&name=4096x4096", startingX: 350, startingY: 400, users: {}} ,
    igloo: {users: {}},
}

const clothesOptions = {
    head: {
        head1: { name: "Hard Hat", spriteSheet: "images/player/hats/hardhat.png" },
        head2: { name: "Crown", spriteSheet: "images/player/hats/crown.png" },
        // Add more head options as needed
    },
    body: {
        body1: { name: "T-Shirt", spriteSheet: "images/player/body/tshirt.png" },
        body2: { name: "Suit", spriteSheet: "images/player/body/suit.png" },
        // Add more body options as needed
    },
    feet: {
        feet1: { name: "Sneakers", spriteSheet: "images/player/shoes/sneakers.png" },
        feet2: { name: "Boots", spriteSheet: "images/player/shoes/boots.png" },
        // Add more feet options as needed
    },
    // Add more categories if necessary
};






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

        function getRandomColor() {
            const colors = ["red", "blue", "black"];
            const randomIndex = Math.floor(Math.random() * colors.length);
            return colors[randomIndex];
        }
        function getRandomHat() {
            const hat = [clothesOptions.head.head1,clothesOptions.head.head2, null];
            const randomIndex = Math.floor(Math.random() * hat.length);
            return hat[randomIndex];
        }

        rooms[room].users[socket.id] = {
            username,
            color: getRandomColor(),
            currentFrame: 0,
            finalFrame: 0,
            state: "idle",
            clothes: {
                head: getRandomHat(),
                body: clothesOptions.body.body1,
                feet: null,
            },
            x: 350,
            y: 350,
            animationIntervalId: null, // Store the animation interval ID for each user
        };

        // Emit the room information to the user
        io.to(socket.id).emit("roomUpdate", rooms[room]);

        // Broadcast the addition of a new user to others in the room
        socket.to(room).emit("userAdded", socket.id, rooms[room].users[socket.id]);

        console.log("Updated rooms:", rooms);
    });

    // Use the handleMove function from the walking logic file
    socket.on("move", (targetPosition) => walkingLogic.handleMove(socket, targetPosition, rooms, io));

    socket.on("sendMessage", (message) => {
        // Get the user ID from the socket
        const userId = socket.id;

        // Check if the user exists in any room
        for (const room in rooms) {
            if (rooms[room].users[userId]) {
                const user = rooms[room].users[userId];

                // Update the user's message
                user.message = message;
                user.messageTimeout = 100;

                // Broadcast the updated user information to others in the room
                socket.to(room).emit("userUpdated", userId, user);

                console.log(`User ${userId} sent a message: ${message}`);
                break; // Exit the loop once the user is found
            }
        }
    });

    socket.on("changeRoom", (targetRoom) => {
        // Get the user ID from the socket
        const userId = socket.id;
    
        // Check if the target room exists
        if (!rooms[targetRoom]) {
            console.log(`Invalid target room: ${targetRoom}`);
            return;
        }
    
        // Check if the user exists in the current room
        const currentRoom = Object.keys(rooms).find(room => rooms[room].users[userId]);
        if (!currentRoom) {
            console.log(`User not found in any room`);
            return;
        }
    
        // Remove the user from the current room
        const user = rooms[currentRoom].users[userId];
        delete rooms[currentRoom].users[userId];
    
        // Leave the user from the current room
        socket.leave(currentRoom);
    
        // Join the user to the target room
        socket.join(targetRoom);

        // Set the user's position to the starting position of the new room
        user.x = rooms[targetRoom].startingX;
        user.y = rooms[targetRoom].startingY;
        user.animationTarget = {x: rooms[targetRoom].startingX, y: rooms[targetRoom].startingY}
        console.log(user)
        rooms[targetRoom].users[userId] = user;
            // Clear the user's animation interval and reset animation-related properties
    clearInterval(user.animationIntervalId);
    user.animationIntervalId = null;
    user.animationTarget = null;
    user.animationCurrentStep = 0;
    user.delayBetweenFrames = 0;
    
        // Broadcast the removal of the user from the current room and the addition to the target room
        socket.to(currentRoom).emit("userRemoved", userId);
        socket.to(targetRoom).emit("userAdded", userId, user);
    
        // Delay before emitting the updated room information to the user
        setTimeout(() => {
            // Emit the updated room information to the user
            io.to(socket.id).emit("roomUpdate", rooms[targetRoom]);
    
            // Broadcast the updated positions to users in the same room
            io.to(currentRoom).emit("roomUpdate", rooms[currentRoom]);
            io.to(targetRoom).emit("roomUpdate", rooms[targetRoom]);
    
            console.log(`User ${userId} changed room from ${currentRoom} to ${targetRoom}`);
        }, 500); // You can adjust the delay as needed
    });
    
    

    // Event: Disconnect
socket.on("disconnect", function () {
    console.log('User disconnected');

    // Remove the user from the specified room
    for (const room in rooms) {
        if (rooms[room].users[socket.id]) {
            const user = rooms[room].users[socket.id];

            // Clear the animation interval when a user disconnects
            if (user.animationIntervalId) {
                clearInterval(user.animationIntervalId);
            }

            // Broadcast the removal of a user to others in the room
            socket.to(room).emit("userRemoved", socket.id);

            delete rooms[room].users[socket.id];
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
        for (const userId in rooms[room].users) {
            const user = rooms[room].users[userId];
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
                user.currentFrame = user.finalFrame
                user.state = "idle";

                // Ensure the user reaches the exact target position when the animation is complete
                if (user.animationTarget) {
                    user.x = user.animationTarget.x;
                    user.y = user.animationTarget.y;
                }


            }
            user.messageTimeout = user.messageTimeout - 1;
            if(user.messageTimeout <= 0) {
                user.message = ""
            }
        }

        // Broadcast the updated positions to users in the same room
        io.to(room).emit("roomUpdate", rooms[room]);
    }

}, serverTickRate);

httpServer.listen(PORT, () => {
    console.log(`listening on port ${PORT}`)
});
