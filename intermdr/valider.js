//nécessitant des dépendances.
const mongoose = require("mongoose");

const userModel = mongoose.model("User");

//niveau intermédiaire pour vérifier l'utilisateur existant.
module.exports.emailExist = function(req, res, next) {
  userModel.findOne({ email: req.body.email }, function(err, result) {
    if (err) {
      res.render("message", {
        title: "Erreur",
        msg: "Une erreur s'est produite lors de la vérification de @mail.",
        status: 500,
        error: err,
        user: req.session.user
      });
    } else if (result) {
      res.render("message", {
        title: "Erreur",
        msg: "Utilisateur déjà existé",
        status: 500,
        error: "",
        user: req.session.user
      });
    } else {
      next();
    }
  });
};
