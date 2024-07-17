const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userinfo: {
    type: Object,
  },
  twitter: {
    required: true,
    type: String,
  },
});

module.exports = mongoose.model("User", userSchema);
