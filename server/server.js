//basic setting up
if (process.env.NODE_ENV !== "production") require("dotenv").config();
const PORT = process.env.PORT || 5000;

//importing packages
const express = require("express");
const os = require("os");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");

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
      }
    );
    console.log("Connected to database");
  } catch (error) {
    console.log("Failed to connect to database", error);
  }
})();

//crearte server using http
const app = express();
const server = http.createServer(app);

//middlewares
app.use(express.json());
app.use(cors());

//Routees
app.use("/", require("./routes/main"));
app.use("/users", require("./routes/users"));

//start listening
server.listen(PORT, () => {
  console.log(`Server running at - ${os.hostname()} on PORT : ${PORT}`);
});

module.exports = {
  server,
};
