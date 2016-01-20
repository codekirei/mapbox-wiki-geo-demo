import socketio from 'socket.io-client'

const io = socketio('http://localhost:3000')

io.on('connect', () => console.log('connected to server via socket.io'))
