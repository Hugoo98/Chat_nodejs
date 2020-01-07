const express = require("express");
const mongoose = require("mongoose");

//intermédiaires
const authentifier = require("../../intermdr/authentifier.js");
const crypto = require("../../libssl/crypto.js");

const router = express.Router();

const userModel = mongoose.model("User");

module.exports.controller = function(app) {
  //Itinéraire de la connexion
  router.get("/login", authentifier.loggedIn, function(req, res) {
    res.render("login", {
      title: "User Login",
      user: req.session.user,
      chat: req.session.chat
    });
  });

  //Itinéraire de la deconnexion
  router.get("/logout", function(req, res) {
    delete req.session.user;
    res.redirect("/user/login");
  });

   //chemin pour se connecter
   router.get("/login", authentifier.loggedIn, function(req, res) {
    res.render("login", {
      title: "User Login",
      user: req.session.user,
      chat: req.session.chat
    });
  });

  //chemin pour se deconnecter
  router.get("/logout", function(req, res) {
    delete req.session.user;
    res.redirect("/user/login");
  });

  //chemin pour se connecter
  router.post("/api/v1/login", authentifier.loggedIn, function(req, res) {
    const epass = crypto.encryptPassword(req.body.password);

    userModel.findOne(
      { $and: [{ email: req.body.email }, { password: epass }] },
      function(err, result) {
        if (err) {
          res.render("message", {
            title: "Erreur",
            msg: "Some Error Occured During LogiUne erreur s'est produite lors de la connexion.",
            status: 500,
            error: err,
            user: req.session.user,
            chat: req.session.chat
          });
        } else if (result == null || result == undefined || result == "") {
          res.render("message", {
            title: "Erreur",
            msg: "Utilisateur introuvable, Vérifiez votre identifiant ou mot de passe",
            status: 404,
            error: "",
            user: req.session.user,
            chat: req.session.chat
          });
        } else {
          req.user = result;
          delete req.user.password;
          req.session.user = result;
          delete req.session.user.password;
          res.redirect("/chat");
        }
      }
    );
  });

  app.use("/user", router);
}; 