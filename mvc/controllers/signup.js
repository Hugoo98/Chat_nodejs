const express = require("express");
const mongoose = require("mongoose");
const shortid = require("shortid");

//intermédiaires
const authentifier = require("../../intermdr/authentifier.js");
const valider = require("../../intermdr/valider.js");
const crypto = require("../../libssl/crypto.js");

const router = express.Router();

const userModel = mongoose.model("User");

module.exports.controller = function(app) {
  //Itinéraire de l'inscription
  router.get("/signup", authentifier.loggedIn, function(req, res) {
    res.render("signup", {
      title: "User Signup",
      user: req.session.user,
      chat: req.session.chat
    });
  });

  //api pour créer un utilisateur
  router.post("/api/v1/signup", authentifier.loggedIn, valider.emailExist, function(
    req,
    res
  ) {
    const today = Date.now();
    const id = shortid.generate();
    const epass = crypto.encryptPassword(req.body.password);

    //créer un utilisateur.
    const newUser = new userModel({
      userId: id,
      username: req.body.username,
      email: req.body.email,
      password: epass,
      createdOn: today,
      updatedOn: today
    });

    newUser.save(function(err, result) {
      if (err) {
        console.log(err);
        res.render("message", {
          title: "Erreur",
          msg: "Erreur s'est produite lors de l'inscription.",
          status: 500,
          error: err,
          user: req.session.user,
          chat: req.session.chat
        });
      } else if (result == undefined || result == null || result == "") {
        res.render("message", {
          title: "Vide",
          msg: "Utilisateur n'est pas créé veuillez réessayer",
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
    });
  });

  app.use("/user", router);
};