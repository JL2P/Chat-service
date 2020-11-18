const express = require("express");
const socketio = require("socket.io");
const http = require("http");

const { addUser, removeUser, getUser, getUsersInRoom } = require("./users");

const PORT = process.env.PORT || 5000;

const router = require("./router");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

io.on("connection", (socket) => {
  //   console.log("새로운 연결!!");

  socket.on("join", ({ name, room }, callback) => {
    console.log("name:", name, "room", room);
    const { error, user } = addUser({ id: socket.id, name, room });

    if (error) {
      callback(error);
    }

    // 본인에게만 보임
    socket.emit("message", {
      user: "admin",
      text: `${user.name} 님, ${user.room} 에 오신 것을 환영합니다`,
    });

    // 채팅방에 있는 모든 유저에게 보임
    socket.broadcast.to(user.room).emit("message", {
      user: "admin",
      text: `${user.name} 님이 들어왔습니다.`,
    });

    socket.join(user.room);

    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit("message", {
      user: user.name,
      text: message,
    });

    callback();
  });

  socket.on("disconnect", () => {
    console.log("사용자가 나갔습니다!");
  });
});

app.use(router);

server.listen(PORT, () => console.log(`${PORT} 포트 서버 시작`));
