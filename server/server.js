//basic setting up
if (process.env.NODE_ENV !== "production") require("dotenv").config();
const PORT = process.env.PORT || 5000;

//importing packages
const express = require("express");
const os = require("os");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const cookieParser = require("cookie-parser");
const socketio = require("socket.io");

//connect to DB
(async () => {
  try {
    await mongoose.connect(
      process.env.NODE_ENV !== "test"
        ? process.env.DATABASE_URL
        : process.env.TEST_DATABASE_URL,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
      }
    );
    console.log("Connected to database");
  } catch (error) {
    console.log("Failed to connect to database", error);
  }
})();

//remove all this stupidity from here and port these to the new server
//crearte server using http
//we need to use http here for socket.io
const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  origins: "localhost:3000* http://localhost:3000:* http://www.domain.com:*",
});

io.use((socket, next) => {
  try {
    let cookies = socket.handshake.headers.cookie;

    //split and parse the cookies
    let cookieObj = {};
    cookies.split(";").map((cookie) => {
      let key_value = cookie.split("=");
      cookieObj[key_value[0].trim()] = key_value[1];
    });

    if (cookieObj.sasachid_tk) {
      console.log(`User ${cookieObj.sasachid_un} allowed`);
      next();
    } else {
      throw new Error("Auth fail");
    }
  } catch (err) {
    next(err);
  }
}).on("connection", (socket) => {
  //console.log(socket.handshake);
  console.log(socket.connected);
});

//middlewares
app.use(cookieParser());

var whitelist = ["http://localhost:3000", "https://kite-chat.herokuapp.com"];
var corsOptions = {
  origin: function (origin, callback) {
    console.log(origin);
    //the !origin is for services like postman
    console.log("New ", origin);
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      //i dont like this it prints the shit
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());

//redirect to https
//does'nt make much sense on a server FOR NOW
// if (process.env.NODE_ENV === "production") {
//   app.use((req, res, next) => {
//     if (req.header("x-forwarded-proto") !== "https")
//       res.redirect(`https://${req.header("host")}${req.url}`);
//     else next();
//   });
// }

//Routes
app.use("/", require("./routes/main"));
app.use("/users", require("./routes/users"));

//start listening
server.listen(PORT, () => {
  console.log(`Server running at - ${os.hostname()} on PORT : ${PORT}`);
});

module.exports = {
  server,
};
