const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const User = new Schema(
  {
    email: String,
    name: String,
    nickname: String,
    picture: String,
    messages: [{ type: Schema.Types.Mixed}],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', User);
