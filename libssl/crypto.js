const crypto = require("crypto");

module.exports.encryptPassword = function(password) {
  var hash = crypto
	.createHmac("sha256", password)
	.update("1996-123")
        .digest("hex");
  return hash;
  return hash;
};
