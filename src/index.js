// server.js
//things I want to add
//games
//seasons
//hoverable props
//igloo customization
//player inventory
//connect to a database
//a hunger system could be cool
//pets and pokemon style fighting
//add logic for preventing players to walk everywhere on map

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
    },
    connect4: {
        name: "connect4",
        spritesheet: "images/games/connect4/board.png",
        width: 50,
        height: 50,
        animation: false,
        floor: false,
        trigger: { game: "connect4", room: "room1" }
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
    towncenter: {
        src: "https://pbs.twimg.com/media/E9mVH28XsAIyG6F?format=jpg&name=4096x4096", startingX: 350, startingY: 400, users: {},
        doors: [{
            topLeft: { x: 250, y: 280 },
            bottomRight: { x: 320, y: 345 }, goTo: "coffeeshop"
        }]
    },
    igloo: { users: {} },
    coffeeshop: {
        src: "https://preview.redd.it/nzvzedygrjt81.jpg?width=640&crop=smart&auto=webp&s=49a4d8a03e68e4bf83a05ece9b8ece8a5a5fec89",
        startingX: 260,
        startingY: 400,
        users: {},
        furniture: [
            {
                type: "connect4",
                x: 300, // Adjust the x-coordinate based on your preference
                y: 200, // Adjust the y-coordinate based on your preference
                frame: 0,
                furnitureOptions: furnitureOptions["connect4"],
            }]
    }
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

let connect4Rooms = {
    room1: {
        player1: null,
        player2: null,
        game: []
    },
    room2: {
        player1: null,
        player2: null,
        game: []
    }
}

// Create a map to store user IDs and their corresponding sockets
const userSocketMap = {};

const connect4Logic = require('./scripts/games/connect4.js');

io.on("connection", (socket) => {


    userSocketMap[socket.id] = socket;


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
            const hat = [clothesOptions.head.head1, clothesOptions.head.head2, null];
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

    socket.on("joinConnect4Room", (roomId) => {
        // Join a Connect 4 game room
        if (connect4Rooms[roomId]) {
            if (connect4Rooms[roomId].player1 == null) {
                connect4Rooms = connect4Logic.createConnect4Room(roomId, connect4Rooms, socket)
            } else if (connect4Rooms[roomId].player2 == null) {
                connect4Rooms = connect4Logic.joinConnect4Room(roomId, connect4Rooms, io, socket);
            }
        }


    });


    socket.on("quitConnect4", (roomId) => {
        const connect4GameInfo = connect4Rooms[roomId];
        let loser = socket.id;
        const player1 = connect4GameInfo.player1;
        const player2 = connect4GameInfo.player2;
        let winner;
        if (player1 == loser) {
            winner = player2
        } else if (player2 == loser) {
            winner = player1;
        }
        connect4Logic.endConnect4(winner, loser, io, connect4Rooms, roomId);
    })

    socket.on("dropconnect4", (data) => {
        const droppedColumn = data.column;
        const connect4GameInfo = connect4Rooms[data.roomId];
        let player1 = connect4GameInfo.player1;
        let player2 = connect4GameInfo.player2;
        let playerTurn = connect4GameInfo.playerTurn;
        console.log(data)


        if (socket.id === playerTurn) {
            // Switch turns
            playerTurn = playerTurn === player1 ? player2 : player1;
            console.log("hit here")

            // Get the current game state
            let game = connect4GameInfo.game;

            // Find the lowest available row in the dropped column
            let row = connect4Logic.findLowestEmptyRow(game, droppedColumn);

            // Check if the column is full
            if (row !== -1) {
                // Update the game board with the player's piece
                game[row][droppedColumn] = playerTurn === player1 ? 1 : 2;

                // Emit an event to inform each player about the updated game state
                io.to(player1).emit('turnUpdateConnect4', game);
                io.to(player2).emit('turnUpdateConnect4', game);

                // Check if the current move resulted in a winning state
                if (connect4Logic.isConnectFour(game, row, droppedColumn)) {
                    // Emit an event to inform both players about the winning state
                    io.to(player1).emit('gameOverConnect4', { winner: playerTurn });
                    io.to(player2).emit('gameOverConnect4', { winner: playerTurn });
                    player1 = null;
                    player2 = null;
                    playerTurn = null;
                    console.log("game over")

                    // Reset the game state or perform any other actions for a new game
                    // connect4GameInfo.game = initializeGame(); // You need to define an initializeGame function
                } else {
                    // Update the playerTurn in the game info
                    connect4GameInfo.playerTurn = playerTurn;
                }
            } else {
                // The column is full, inform the player about it
                socket.emit('columnFull', { message: 'The selected column is full.' });
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
        const currentRoom = Object.keys(rooms).find((room) => rooms[room].users[userId]);
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
        user.animationTarget = { x: rooms[targetRoom].startingX, y: rooms[targetRoom].startingY };

        // Clear the user's animation interval and reset animation-related properties
        clearInterval(user.animationIntervalId);
        user.animationIntervalId = null;
        user.animationTarget = null;
        user.animationCurrentStep = 0;
        user.delayBetweenFrames = 0;

        // Add the user to the target room
        rooms[targetRoom].users[userId] = user;

        // Broadcast the addition of the user to the target room
        io.to(targetRoom).emit("userAdded", userId, user);

        // Emit the updated room information to the user
        io.to(userId).emit("roomUpdate", rooms[targetRoom]);

        // Broadcast the updated positions to users in the same room
        io.to(currentRoom).emit("roomUpdate", rooms[currentRoom]);
        io.to(targetRoom).emit("roomUpdate", rooms[targetRoom]);

        console.log(`User ${userId} changed room from ${currentRoom} to ${targetRoom}`);
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
    walkingleft: [2, 10, 3, 10, 2, 9, 1, 9], 
    walkingupleft: [3, 11, 11, 11, 3, 10, 10], 
    walkingup: [4, 11, 3, 11, 4, -11, -3], 
    walkingupright: [-3, -11, -11, -11, -3, -10, -10], 
    walkingright: [-2, -10, -3, -10, -2, -9, -1, -9], 
    walkingdownright: [-1, -9, -10, -9, -1, -8, -15, -8], 
    walkingdown: [0, 8, 15, 8, 0, 14, -15, 14], 
    walkingdownleft: [1, 9, 10, 9, 1, 8, 15, 8], 
    idle: [0],
};

const framerate = 4;

function relocateUser(userPositionX, userPositionY, room, userId, rooms, socket) {
    const currentRoom = rooms[room];

    // Iterate through each door in the room
    if (currentRoom.doors) {
        for (let i = 0; i < currentRoom.doors.length; i++) {
            const door = currentRoom.doors[i];
            // Check if the user's position is within the boundaries of the current door
            if (
                userPositionX >= door.topLeft.x &&
                userPositionX <= door.bottomRight.x &&
                userPositionY >= door.topLeft.y &&
                userPositionY <= door.bottomRight.y
            ) {
                console.log("User hit the door to " + door.goTo);


                // Emit an event to the user who changed rooms to inform them about their new room


                return door.goTo;
            }
        }
    }
    return false;
}



setInterval(() => {
    for (const room in rooms) {
        for (const userId in rooms[room].users) {


            const user = rooms[room].users[userId];

            if (user) {
                if (user.animationTarget && user.animationCurrentStep < user.animationTotalSteps) {
                    // Increment the animation step
                    user.animationCurrentStep++;
                    user.finalFrame = animations[user.state][0];

                    // Update user position
                    user.x += user.deltaX;
                    user.y += user.deltaY;

                    // Determine the current animation frame based on the user's state
                    const animationFrames = animations[user.state];
                    if (user.delayBetweenFrames == 0) {
                        const currentFrame = animationFrames[(user.animationCurrentStep) % animationFrames.length];
                        user.currentFrame = currentFrame;
                        user.delayBetweenFrames = framerate;
                    } else if (isNaN(user.delayBetweenFrames)) {
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
                if (user.messageTimeout <= 0) {
                    user.message = ""
                }
                let userSocket = (userSocketMap[userId])
                const relocate = relocateUser(user.x, user.y, room, userId, rooms, userSocketMap[userId])
                if (relocate) {
                    userSocket.emit("test", relocate);
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
