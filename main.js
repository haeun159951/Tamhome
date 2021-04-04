const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const hbs = require("express-handlebars");
const clientSessions = require("client-sessions");
const session = require("express-session");
const mongoose = require("mongoose");
const userRoute = require("./controllers/userRoute");
const roomRoute = require("./controllers/roomRoute");

require("dotenv").config();
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.engine(
  ".hbs",
  hbs({
    extname: ".hbs",
    defaultLayout: "main",
    runtimeOptions: {
      allowProtoPropertiesByDefault: true,
      allowProtoMethodsByDefault: true,
    },
  })
);
app.set("view engine", ".hbs");
app.use(express.static("public"));

app.use(
  clientSessions({
    cookieName: "session",
    secret: process.env.COOKIE_SECRET,
    duration: 2 * 60 * 1000,
    activeDuration: 1000 * 60,
  })
);

app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

app.use("/", userRoute);
app.use("/room", roomRoute);

const DBURL = process.env.MONGOURL;
mongoose.connect(DBURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});
mongoose.connection.on("open", () => {
  console.log("Database connection open.");
});

app.get("/script", function (req, res) {
  res.sendFile(path.join(__dirname + "./js/script.js"));
});

const HTTP_PORT = process.env.PORT;

function onHttpStartup() {
  console.log("Express Server running on port " + HTTP_PORT);
}

app.listen(HTTP_PORT, onHttpStartup);
