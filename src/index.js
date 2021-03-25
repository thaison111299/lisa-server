const express = require('express')
const app = express()
const socketio = require('socket.io')
const cors = require('cors')
const http = require('http')
const mongoose = require('mongoose');
const Message = require('./models/Message')
const User = require('./models/User')
const Room = require('./models/Room')

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
  socket.on('get-lastroom', async user => {
    console.log(`${user.name} want to get last room`)
    let lastRoom = await User.findOne({ email: user.email })
      .then(userfinded => {
        console.log(`Get last room of user ${user.name} successfully`)
        return userfinded.lastRoom
      })
      .catch(error => {
        console.log(`Get last room of user ${user.name} error: ${error.message}`)
        return null
      })
    socket.emit('lastroom', lastRoom)
  })

  socket.on('get-rooms', user => {
    console.log(`${user.name} get rooms`)
    Room.find({}).then(rooms => {
      let matchRooms = rooms.filter(room => {
        return room.name.includes(user.nickname)
      })
      console.log(`Finded ${matchRooms.length} inboxs match for user: ${user.name} `)
      socket.emit('rooms', matchRooms)
    })
      .catch(error => {
        console.log(`Find rooms error for user: ${user.name} - ${error.message}`)
      })
  })

  socket.on('user', user => {
    let { email, name, nickname, picture } = user
    User.findOne({ email: email })
      .then(user => {
        if (!user) {
          let newUser = { email, name, nickname, picture, lastRoom: null }
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

  // Get message and add new room to roomcollection?
  socket.on('get-messages', async ({ roomName, user, target }) => {
    console.log(`Some one want to get all messages of room: ${roomName}`)
    // Find 10 latest messages
    Message.find({ room: roomName })
      .sort({ createdAt: -1 })
      .limit(10)
      .then(messages => {
        socket.emit('messages', messages)
      })
      .catch(error => { })

    // send add to new room part 
    let room = await Room.findOne({ name: roomName })
      .then(room => room)
      .catch(error => null)

    if (!room) {
      new Room({
        name: roomName,
        lastMessage: null,
        members: [user, target],
        createdBy: user,
      }).save()
        .then(() => {
          console.log(`Save new room: ${roomName} to db sucessfully`)
        })
        .catch(error => {
          console.log(`Save room: ${roomName} to db fail`)
        })
    } else {
      console.log(`Room ${roomName} has been existed, cant not save!`)
    }

    // set last room for user is this room
    User.updateOne({ email: user.email },
      {
        "$set": {
          "lastRoom": room
        }
      }
      , (error, userUpdated) => {
        if (!error)
          console.log(`Update ${user.name} successfully`)
        else
          console.log(`Update ${user.name} fail`)
      }
    )

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

    // Update last message of that room 

    Room.updateOne({ name: room },
      {
        "$set": {
          "lastMessage": message
        }
      }
      , (error, roomUpdated) => {
        if (!error)
          console.log('Update last message sucessfully')
        else
          console.log('Update last message fail')
      }
    )


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