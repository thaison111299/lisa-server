const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const Room = new Schema(
  {
    name: String,
    lastMessage: Schema.Types.Mixed,
    createdBy: Schema.Types.Mixed,
    members:
      [{
        type: Schema.Types.Mixed
      }]
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Room', Room);
