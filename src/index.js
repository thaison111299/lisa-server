const express = require('express')
const app = express()
const socketio = require('socket.io')
const cors = require('cors')
const http = require('http')
const mongoose = require('mongoose');
const Message = require('./model/Message')
const User = require('./model/User')

const server = http.createServer(app)
const PORT = process.env.PORT || 1000 // socket.io

let origin = 'http://localhost:3000' //'https://lisa-64f51.web.app'

const io = socketio(server, {
  cors: {
    origin,
    methods: ['GET', 'POST']
  }
})

app.use(cors())

io.on('connection', socket => {
  console.log('New connection:', socket.id)
  // get messages and users
  socket.on('user', user => {
    let { email, name, nickname, picture } = user
    User.findOne({ email: email })
      .then(user => {
        if (!user) {
          let newUser = { email, name, nickname, picture }
          new User(newUser).save()
            .then(() => {
              console.log(`Save ${nickname} to db sucessfully`)
            })
            .catch(error => {
              console.log(`Save ${nickname} to db fail`)
            })
        } else {
          console.log(`User ${nickname} has been existed, cant not save!`)
        }
      })
      .catch(error => { })
    console.log(`User just in: ${nickname}`)
  })

  socket.on('get-users', () => {
    User.find({})
      .then(users => {
        socket.emit('users', users)
      })
      .catch(error => { })
  })

  socket.on('get-messages', roomName => {
    console.log(`Some one want to get all messages of room: ${roomName}`)
    // Find 10 latest messages
    Message.find({ room: roomName })
      .sort({ createdAt: -1 })
      .limit(10)
      .then(messages => {
        socket.emit('messages', messages)
      })
      .catch(error => { })
  })
  // socket.join(room)
  //socket.broadcast.to(room).emit('messages', matchRoomMessages)
  // io.to(room).emit('messages', matchRoomMessages)
  // socket.on('disconnect', () =>
  // const kitty = new Cat({ name: 'Zildjian' });
  // kitty.save().then(() => console.log('meow'));
  socket.on('message', message => {
    let { room, by, text } = message
    socket.join(room)
    console.log(`Room: ${room} - ${by.name}: ${text}`)
    new Message(message).save()
      .then(() => console.log('Save message to Mongodb sucessfully'))
      .catch(error => {
        console.log(`Save message to Mongodb error: ${error.message}`)
      })
    io.to(room).emit('message', message)
  })

})


server.listen(PORT, async () => {
  console.log(`Soket.io is listening to port: ${PORT}...`)
  await connectMongodb()
})


async function connectMongodb() {
  console.log('Connecting to Mongodb...')
  const MONGODB_URL = 'mongodb+srv://admin:admin@cluster0.wjiax.mongodb.net/lisa?retryWrites=true&w=majority'
  let options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  }
  try {
    await mongoose.connect(MONGODB_URL, options);
    console.log('Connect Mongodb successfully');
  } catch (error) {
    console.log('Connect Mongodb fail');
  }
}