const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const cors = require('cors')
const mongoose = require('mongoose')
const User = require('./models/User')
const Room = require('./models/Rooms')
const Message = require('./models/Message')

const app = express()
const server = http.createServer(app)

const PORT = process.env.PORT || 1000 // socket.io

let origin = 'https://lisa-64f51.web.app' //'http://localhost:3000' 

const io = socketio(server, {
  cors: {
    origin,
    methods: ['GET', 'POST']
  }
})

app.use(cors())

// them catch cho primise
io.on('connection', socket => {
  console.log('New connection:', socket.id)


  socket.on('user', async user => {
    const { nickname } = user
    socket.join(nickname) // Join user to name's room
    // If this user not in db => save and emit 'new user' event to all clients except this guy
    let userFound = await User.findOne({ nickname }).then(user => user)

    if (!userFound) {
      new User(user).save()
      socket.broadcast.emit('new user', user)
    }

    let userListFound = await User.find({})
      .then(users => users.filter(dbUser => dbUser.nickname !== user.nickname))

    socket.emit('user list', userListFound)

    let roomListFound = await Room.find({}).then(rooms => rooms).catch(error => [])
    socket.emit('room list', roomListFound)


  })

  socket.on('room', async ({ room, nickname }) => {
    let roomFound = await Room.findOne({ name: room.name }).then(room => room)
    if (!roomFound) new Room(room).save()
    // Leave previous rooms    
    socket.rooms.forEach(r => {
      if (r !== socket.id && r !== nickname)
        socket.leave(r)
    })
    // Join new room
    socket.join(room.name)

    // Get all messages of that room name, message= {roomName}
    let messageListFound = await Message.find({ roomName: room.name }).then(messages => messages) // List 
    socket.emit('message list', messageListFound)
  })

  socket.on('message', message => {
    new Message(message).save()
    // io.to(message.roomName).emit('message', { ...message, createdAt: new Date() })

    message.roomName.split(' and ').forEach(nn => io.to(nn).emit('message', { ...message, createdAt: new Date() }))
  })

  socket.on('get room', async roomName => {
    let roomFound = await Room.findOne({ name: roomName })
      .then(room => room).
      catch(error => null)
    if (roomFound) socket.emit('room', roomFound)
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
    console.log(error.message)
    console.log('Connect Mongodb fail');
  }
}