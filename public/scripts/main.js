const socket = io();

const connectButton = document.getElementById("connect");
const username = document.getElementById("username")
connectButton.addEventListener("click", ()=>{
    if(!username.value) return;
    socket.emit("setUsername", username.value)
})
