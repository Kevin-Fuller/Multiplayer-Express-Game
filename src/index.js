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

    function calculateAngle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }

    socket.on("move", (targetPosition) => {
        const roomsArray = Array.from(socket.rooms);
        const room = roomsArray.length > 1 ? roomsArray[1] : undefined;

        if (room && rooms[room] && rooms[room][socket.id]) {
            const user = rooms[room][socket.id];

            user.state = "walking";

            // Calculate the distance between current and target position
            const deltaX = targetPosition.x - user.x;
            const deltaY = targetPosition.y - user.y;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            console.log(distance)
            console.log(`start position: ${user.x}`)

            // Set the distance scale for animation duration (e.g., 200 pixels per second)
            const distanceScale = 200;

            // Calculate the animation duration based on distance
            const animationDuration = distance / distanceScale;
            console.log(animationDuration)

            // Calculate the total steps based on duration and tick rate
            const totalSteps = Math.floor(animationDuration * 60);
            console.log(totalSteps)

            // Set the target position for animation
            user.animationTarget = targetPosition;

            // Set the total steps and step interval for animation
            user.animationTotalSteps = totalSteps;

            // Reset the current step
            user.animationCurrentStep = 0;

            // Calculate the angle between current and target position
            const angle = calculateAngle(user.x, user.y, targetPosition.x, targetPosition.y);

            // Convert the angle to one of the eight directions
            const directions = ["left", "up-left", "up", "up-right", "right", "down-right", "down", "down-left"];
            const index = Math.round((angle + Math.PI) / (Math.PI / 4)) % 8;
            const direction = directions[index];

            user.animationDirection = direction;

            //used to calculate the total distance moved per step in the animation.
            user.deltaX = (user.animationTarget.x - user.x) / user.animationTotalSteps;
            user.deltaY = (user.animationTarget.y - user.y) / user.animationTotalSteps;

        }
    });

    // Event: Disconnect
    socket.on("disconnect", function () {
        console.log('User disconnected');

        user.state = "idle";
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

            if (user.animationTarget && user.animationCurrentStep < user.animationTotalSteps) {
                // Increment the animation step
                user.animationCurrentStep++;


            // // Calculate the delta for x and y based on the total distance and total steps
            // const deltaX = (user.animationTarget.x - user.x) / user.animationTotalSteps;
            // const deltaY = (user.animationTarget.y - user.y) / user.animationTotalSteps;


            // Update user position
            user.x += user.deltaX;
            user.y += user.deltaY;

            } else {
                // Set the state to "idle" when the user is not walking
                user.state = "idle";

                // Ensure the user reaches the exact target position when animation is complete
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
