function startConnect4Game(roomId, connect4Rooms, io) {
    const connect4GameInfo = connect4Rooms[roomId];
    const connect4Grid = [
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
    ];
    connect4GameInfo.playerTurn = connect4GameInfo.player1;
    connect4GameInfo.game = connect4Grid;
    io.to(connect4GameInfo.player2).emit("connect4turn", "waiting on player1");
    io.to(connect4GameInfo.player1).emit("connect4turn", "your turn");

    // Return the updated connect4Rooms object
    return connect4Rooms;
}

function createConnect4Room(roomId, connect4Rooms, player) {
    connect4Rooms[roomId].player1 = player.id;
    return connect4Rooms;
}

function joinConnect4Room(roomId, connect4Rooms, io, player) {
    if(connect4Rooms[roomId].player1 != player.id) {
        connect4Rooms[roomId].player2 = player.id;
        connect4Rooms = startConnect4Game(roomId, connect4Rooms, io);
       return connect4Rooms;
    }
}

function isConnectFour(game, row, col) {
    const player = game[row][col];

    // Check horizontally
    let count = 1; // Count the current disc
    let c = col + 1;

    // Check to the right
    while (c <= 6 && game[row][c] === player) {
        count++;
        c++;
    }

    c = col - 1;
    // Check to the left
    while (c >= 0 && game[row][c] === player) {
        count++;
        c--;
    }

    if (count >= 4) {
        return true;
    }

    // Check vertically
    count = 1; // Reset count for vertical check
    let r = row + 1;

    // Check downwards
    while (r <= 5 && game[r][col] === player) {
        count++;
        r++;
    }

    r = row - 1;
    // Check upwards
    while (r >= 0 && game[r][col] === player) {
        count++;
        r--;
    }

    if (count >= 4) {
        return true;
    }

    // Check diagonally (top-left to bottom-right)
    count = 1; // Reset count for diagonal check
    c = col + 1;
    r = row + 1;

    // Check diagonally to the bottom-right
    while (c <= 6 && r <= 5 && game[r][c] === player) {
        count++;
        c++;
        r++;
    }

    c = col - 1;
    r = row - 1;
    // Check diagonally to the top-left
    while (c >= 0 && r >= 0 && game[r][c] === player) {
        count++;
        c--;
        r--;
    }

    if (count >= 4) {
        return true;
    }

    // Check diagonally (top-right to bottom-left)
    count = 1; // Reset count for diagonal check
    c = col + 1;
    r = row - 1;

    // Check diagonally to the bottom-left
    while (c <= 6 && r <= 5 && r >= 0 && game[r][c] === player) {
        count++;
        c++;
        r--;
    }

    c = col - 1;
    r = row + 1;
    // Check diagonally to the top-right
    while (c >= 0 && r <= 5 && game[r][c] === player) {
        count++;
        c--;
        r++;
    }

    return count >= 4;
}

module.exports = {
    startConnect4Game,
    createConnect4Room,
    joinConnect4Room,
    isConnectFour,
};