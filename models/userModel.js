var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");

mongoose.Promise = require("bluebird");

var userSchema = new Schema({
  email: {
    type: String,
    unique: true,
  },

  fname: String,

  lname: String,

  password2: String,

  isAdmin: {
    type: Boolean,
    default: false,
  },
});

userSchema.pre("save", function (next) {
  bcrypt.genSalt(10).then((salt) => {
    bcrypt.hash(this.password2, salt).then((hash) => {
      this.password2 = hash;
      console.log("Encrypted");
      next();
    });
  });
});

module.exports = mongoose.model("Users", userSchema);
