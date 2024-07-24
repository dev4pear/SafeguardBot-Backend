// const mongoose = require("mongoose");
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  userinfo: {
    type: Object,
  },
  twitter: {
    required: false,
    type: String,
    default: "",
  },
  prevPoint: {
    required: false,
    type: Number,
    default: 0,
  },
  point: {
    required: false,
    type: Number,
    default: 0,
  },
});

export const User = mongoose.model("User", userSchema);
