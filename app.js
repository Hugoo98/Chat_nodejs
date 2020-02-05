const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const mongoStore = require("connect-mongo")(session);
const methodOverride = require("method-override");
const path = require("path");
const fs = require("fs");
const logger = require("morgan");

const app = express();
const http = require("http").Server(app);

//port setup
const port = process.env.PORT || 4000;

//socket.io
require("./libssl/chat.js").sockets(http);

app.use(logger("dev"));

//connexion a la DB
const dbPath = "mongodb://localhost/socketChatDB"
mongoose.connect(dbPath, { useNewUrlParser: true });
mongoose.connection.once("open", function() {
  console.log("Connexion à la database établie avec succès.");
});

//http method override middleware
app.use(
  methodOverride(function(req, res) {
    if (req.body && typeof req.body === "object" && "_method" in req.body) {
      var method = req.body._method;
      delete req.body._method;
      return method;
    }
  })
);

//session setup
const sessionInit = session({
  name: "cookie_Utilisateur",
  secret: "1996-123-128-france",
  resave: true,
  httpOnly: true,
  saveUninitialized: true,
  store: new mongoStore({ mongooseConnection: mongoose.connection }),
  cookie: { maxAge: 80 * 80 * 800 }
});

app.use(sessionInit);

//le dossier public
app.use(express.static(path.resolve(__dirname, "./public")));

//configuration du moteur ejs et les vues du dossier
app.set("views", path.resolve(__dirname, "./mvc/views"));
app.set("view engine", "ejs");

//parsing middlewares
app.use(bodyParser.json({ limit: "10mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());

//Fichiers models.
fs.readdirSync("./mvc/models").forEach(function(file) {
  if (file.indexOf(".js")) {
    require("./mvc/models/" + file);
  }
});

//fichiers controllers.
fs.readdirSync("./mvc/controllers").forEach(function(file) {
  if (file.indexOf(".js")) {
    var route = require("./mvc/controllers/" + file);
  //transmission de l'instance de l'appli
    route.controller(app);
  }
});

//la gestion de Erreur 404.
app.use(function(req, res) {
  res.status(404).render("message", {
    title: "404",
    msg: "Page introuvable.",
    status: 404,
    error: "",
    user: req.session.user,
    chat: req.session.chat
  });
});

//Pour devenir un utilisateur connecté.

const userModel = mongoose.model("User");

app.use(function(req, res, next) {
  if (req.session && req.session.user) {
    userModel.findOne({ email: req.session.user.email }, function(err, user) {
      if (user) {
        req.user = user;
        delete req.user.password;
        req.session.user = user;
        delete req.session.user.password;
        next();
      }
    });
  } else {
    next();
  }
}); //fin de la connexion de l'utilisateur 

http.listen(port, function() {
  console.log("Le chat a commencé au port:" + port);
});
