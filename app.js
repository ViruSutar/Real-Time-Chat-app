const express=require('express')
const app=express()
const http=require('http')
const path=require('path')
const socketio=require('socket.io')
const Filter=require('bad-words')
const compression=require('compression')
const {generateMessage,generateLocationMessage}= require('./utils/messages')
const {addUser,removeUser,getUser,getUsersInRoom}=require('./utils/users')
const { Server } = require('http')



const server=http.createServer(app) 
const io=socketio(server)

//compression middleware
app.use(compression())

//heroku config
process.on('SIGTERM',()=>{
    console.log('SIGTERM RECEIVED.Shutting Down gracefully')
    Server.close(()=>{
        console.log('Process Terminated')
    })
})


const publicDirectoryPath=path.join(__dirname,'./public')

app.use(express.static(publicDirectoryPath))


io.on('connection',(socket)=>{

    socket.on('join',(options,callback)=>{
        const {err,user}= addUser({id:socket.id,...options})
         
        if(err){
          return callback(err)
        }
 
       socket.join(user.room)

       socket.emit('message',generateMessage('Admin','Welcome'))
       socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined!`)) //this will emit event except the current user
       
       callback()
 
    })

    socket.on('sendMessage',(message,callback,)=>{
        const user=getUser(socket.id)
       const filter=new Filter()

       if(filter.isProfane(message)){
           return callback('Profanity is not allowed')
       }
       io.to(user.room).emit('message',generateMessage(user.username,message))
       io.to(user.room).emit('roomData',{
           room:user.room,
           users:getUsersInRoom(user.room)
       }) 
       callback()

    })

    socket.on('sendLocation',(coords,callback)=>{
        const user=getUser(socket.id)
       io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
       callback()
    })

    socket.on('disconnect',()=>{
        const user= removeUser(socket.id)
         
        if(user){
            io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left!`))
            io.to(user.room).emit('roomData',{
                room:user.room,
                users:getUsersInRoom(user.room)
            })

        }

    })
})


const PORT=process.env.PORT||  3242

server.listen(PORT,()=>{console.log(`Server is up and running on PORT ${PORT}`)})