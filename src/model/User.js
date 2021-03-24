const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const User = new Schema(
  {
    email: String,
    name: String,
    nickname: String,
    picture: String
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', User);
