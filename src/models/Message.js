const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const Message = new Schema(
  {
    room: Schema.Types.Mixed,
    roomName: String,
    by: Schema.Types.Mixed,
    text: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Message', Message);
