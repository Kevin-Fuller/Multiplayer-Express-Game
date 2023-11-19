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
        };

        // Emit the room information to the user
        io.to(socket.id).emit("roomUpdate", rooms[room]);

        // Broadcast the addition of a new user to others in the room
        socket.to(room).emit("userAdded", socket.id, rooms[room][socket.id]);

        console.log("Updated rooms:", rooms);
    });

    socket.on("move", (position) => {
        // Update the user's position in the specified room
        const roomsArray = Array.from(socket.rooms);
        const room = roomsArray.length > 1 ? roomsArray[1] : undefined;

        if (room && rooms[room] && rooms[room][socket.id]) {
            rooms[room][socket.id].x = position.x;
            rooms[room][socket.id].y = position.y;

            // Emit the updated position only to users in the same room
            io.to(room).emit("roomUpdate", rooms[room]);
        }
    });

    // Event: Disconnect
    socket.on("disconnect", function () {
        console.log('User disconnected');

        // Remove the user from the specified room
        for (const room in rooms) {
            if (rooms[room][socket.id]) {
                // Broadcast the removal of a user to others in the room
                socket.to(room).emit("userRemoved", socket.id);

                delete rooms[room][socket.id];

                // Emit the updated room information after a user disconnects
                io.to(room).emit("roomUpdate", rooms[room]);
            }
        }
    });
});

function getTargetPositions(room) {
    const targets = {};
    for (const userId in rooms[room]) {
        targets[userId] = rooms[room][userId].targetPosition || { x: rooms[room][userId].x, y: rooms[room][userId].y };
    }
    return targets;
}

httpServer.listen(PORT, () => {
    console.log(`listening on port ${PORT}`)
});
