const express = require("express");
const router = express.Router();

const authentifier = require("../../intermdr/authentifier.js");

module.exports.controller = function(app) {
  //Itinéraire à la page du chat
  app.get("/chat", authentifier.checkLogin, function(req, res) {
    res.render("chat", {
      title: "Chat Home",
      user: req.session.user,
      chat: req.session.chat
    });
  });

  app.use(router);
};
