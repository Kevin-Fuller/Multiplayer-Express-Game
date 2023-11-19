const { createServer } = require("http");
const { Server } = require("socket.io");
const PORT = process.env.PORT || 3000;
const express = require('express');
const app = express();

const httpServer = createServer(app);
const io = new Server(httpServer, { /* options */ });

app.use(express.static('public'));

const users = {};


io.on("connection", (socket) => {
  console.log('a user connected')

  socket.on("setUsername", (username)=>{
    console.log(username)

    users[socket.id] = {
        username,
    }
    console.log(users)
  })
  
  socket.on("disconnect", function(){
    console.log('user disconnected')
    delete users[socket.id]
  })
});

httpServer.listen(PORT, ()=>{
    console.log(`listening on port ${PORT}`)
});