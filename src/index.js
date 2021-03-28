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

let origin = 'http://localhost:3000'  //'https://lisa-64f51.web.app'

const io = socketio(server, {
  cors: {
    origin,
    methods: ['GET', 'POST']
  }
})

app.use(cors())

io.on('connection', socket => {
  console.log('New connection:', socket.id)
  socket.on('start app', async user => {
    console.log(`${User.nickname} starts app`)
    // save user to db
    let userFound = await User.findOne({ email: user.email }).then(user => user).catch(error => null)
    if (!userFound)
      new User(user).save()

    // send all user ib db exept they
    let usersFound = await User.find({}).then(users => users).catch(error => [])
    usersFound = usersFound.filter(u => u.email !== user.email)
    socket.emit('send users', usersFound)


    // room 
    let rooms = await Room.find({}).then(rooms => rooms).catch(error => [])
    let matchRooms = rooms.filter(room => room.name.includes(user.nickname))
    socket.emit('rooms', matchRooms)

  })

  socket.on('create room', async room => {
    let roomFound = await Room.findOne({ name: room.name }).then(room => room).catch(error => null)
    if (!roomFound)
      new Room(room).save()
  })

  socket.on('start chat', room => {
    socket.rooms.forEach(roomName => {
      if (roomName !== socket.id)
        socket.leave(roomName)
    })
    socket.join(room.name)
    // give messages
    // console.log(room)
    Message.find({ roomName: room.name }).then(messages => {
      socket.emit('messages', messages)
    }).catch(err => { })
  })

  socket.on('message', message => {
    let { roomName } = message
    io.to(roomName).emit('message', message)
    new Message(message).save()
  })


  // socket.on('get inboxs', async user => {
  //   console.log('Get inboxs')
  //   let rooms = await User.findOne({ email: user.email })
  //     .then(user => user.rooms)
  //     .catch(error => {
  //       console.log(error.message)
  //       return []
  //     })
  //   let messages = []

  //   for (let room of rooms) {
  //     let latestMessage = await Message.findOne({ roomName: room.name })
  //       .sort({ createdAt: -1 }).then(message => message).catch(error => null)
  //     if (latestMessage) {
  //       // console.log(latestMessage)
  //       messages.push(latestMessage)
  //     }
  //   }
  //   socket.emit('inboxs', messages)
  //   // console.log(messages)

  // })


  // // start app thi gui list user 
  // socket.on('start', user => {
  //   console.log('Some one start app')
  //   User.find({})
  //     .then(users => {
  //       users = users.filter(guy => guy.email !== user.email)
  //       socket.emit('users', users)
  //     })
  //     .catch(error => { })
  // })

  // socket.on('login', async user => {
  //   console.log('some one login')
  //   let userFound = await User.findOne({ email: user.email })
  //     .then(user => user).catch(error => null)

  //   if (!userFound) {
  //     new User(user).save()
  //       .then(() => {
  //         User.find({})
  //           .then(users => {
  //             console.log(`emitting Users event...`)
  //             socket.broadcast.emit('users', users)
  //           })
  //           .catch(error => { })
  //       })
  //       .catch(error => { })
  //   }
  // })

  // socket.on('join', roomName => {
  //   socket.rooms.forEach(roomName => {
  //     if (roomName !== socket.id) {
  //       socket.leave(roomName)
  //     }
  //   });
  //   socket.join(roomName)
  //   Message.find({ roomName: roomName })
  //     .then(messages => socket.emit('messages', messages))
  //     .catch(error => { })
  // })

  // socket.on('update user', async ({ user, room }) => {
  //   console.log(user.name, room.name)
  //   let userFound = await User.findOne({ email: user.email })
  //     .then(user => user)
  //     .catch(error => null)
  //   if (!userFound)
  //     return
  //   let rooms = userFound.rooms
  //   let newRooms = rooms.filter(r => r.name !== room.name)
  //   newRooms = [room, ...newRooms]
  //   User.updateOne({ email: user.email }, { rooms: newRooms }, (error) => {
  //     if (error)
  //       console.log(error.message)
  //   })

  // })

  // socket.on('message', ({ message, room }) => {
  //   console.log(`${message.by.name}: ${message.text} to ${room.name}`)
  //   new Message(message).save()
  //   message.createdAt = new Date()
  //   io.to(room.name).emit('message', message)
  // })


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