const { createServer } = require("http");
const { Server } = require("socket.io");
const PORT = process.env.PORT || 3000;
const express = require('express');
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
            x: 0,
            y: 0,
            animationIntervalId: null, // Store the animation interval ID for each user
        };

        // Emit the room information to the user
        io.to(socket.id).emit("roomUpdate", rooms[room]);

        // Broadcast the addition of a new user to others in the room
        socket.to(room).emit("userAdded", socket.id, rooms[room][socket.id]);

        console.log("Updated rooms:", rooms);
    });

    socket.on("move", (targetPosition) => {
        const roomsArray = Array.from(socket.rooms);
        const room = roomsArray.length > 1 ? roomsArray[1] : undefined;
    
        if (room && rooms[room] && rooms[room][socket.id]) {
            const user = rooms[room][socket.id];
    
            // Calculate the distance between current and target position
            const deltaX = targetPosition.x - user.x;
            const deltaY = targetPosition.y - user.y;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
            // Set the distance scale for animation duration (e.g., 200 pixels per second)
            const distanceScale = 30;
    
            // Calculate the animation duration based on distance
            const animationDuration = distance / distanceScale;
    
            // Calculate the total steps based on duration and tick rate
            const totalSteps = Math.floor(animationDuration * 60);
    
            // Calculate the interval between steps based on total steps
            const stepInterval = 1000 / 60; // Assuming 60 ticks per second
    
            // Set the target position for animation
            user.animationTarget = targetPosition;
    
            // Set the total steps and step interval for animation
            user.animationTotalSteps = totalSteps;
            user.animationStepInterval = stepInterval;
    
            // Reset the current step
            user.animationCurrentStep = 0;
            console.log(user)
        }
    });

    // Event: Disconnect
    socket.on("disconnect", function () {
        console.log('User disconnected');

        // Remove the user from the specified room
        for (const room in rooms) {
            if (rooms[room][socket.id]) {
                // Clear the animation interval when a user disconnects
                if (rooms[room][socket.id].animationIntervalId) {
                    clearInterval(rooms[room][socket.id].animationIntervalId);
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

setInterval(() => {
    for (const room in rooms) {
        for (const userId in rooms[room]) {
            const user = rooms[room][userId];

            // Check if the user has a pending movement
            if (user.animationTarget && user.animationCurrentStep < user.animationTotalSteps) {
                // Increment the animation step
                user.animationCurrentStep++;

                // Update user position based on animation step
                const progress = user.animationCurrentStep / user.animationTotalSteps;
                user.x = user.animationTarget.x * progress + user.x * (1 - progress);
                user.y = user.animationTarget.y * progress + user.y * (1 - progress);
            }
        }

        // Broadcast the updated positions to users in the same room
        io.to(room).emit("roomUpdate", rooms[room]);

    }

}, serverTickRate);

httpServer.listen(PORT, () => {
    console.log(`listening on port ${PORT}`)
});
