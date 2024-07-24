// const mongoose = require("mongoose");
import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  userinfo: {
    type: Object,
  },
});

export const Admin = mongoose.model("Admin", adminSchema);
