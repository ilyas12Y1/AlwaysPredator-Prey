const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {});

const backendplayers = {};

let bushes = [];
let gems = [];
let safezoneblue = [];
let safezonered = [];
let safezoneyellow = [];
let worldW = 15000;
let worldH = 4400;



// généré UNE FOIS
function createWorld() {
 
  for (let i = 0; i < 1; i++) {
    safezoneyellow.push({
      x: 15000/2,
      y: 4400 - 200,
      radius: 150,
      size: 800 * 1.5,
      color: 'yellow'
    })
  }
  for (let i = 0; i < 1; i++) {
    safezonered.push({
      x: 15000 - 200,
      y: 200,
      radius: 150,
      size: 800 * 1.5,
      color: 'red'
    })
  }
  for (let i = 0; i<1; i++) {
    safezoneblue.push({
      x: 200,
      y: 4400 - 200,
      
      radius: 150,
      size: 800 * 1.5,
      color: 'blue'
    });

  }
  for (let i = 0; i < 40; i++) {
    bushes.push({
      x: Math.random() * worldW,
      y: Math.random() * worldH,
      size: 400
    });
  }
for (let i = 0; i < 500; i++) {

  let x = Math.random() * worldW;
  let y = Math.random() * worldH;

  let inSafeZone = false;

  for (const s of safezoneblue) {
    if (Math.hypot(s.x - x, s.y - y) < s.size / 2) {
      inSafeZone = true;
      break;
    }
  }

  for (const s of safezonered) {
    if (Math.hypot(s.x - x, s.y - y) < s.size / 2) {
      inSafeZone = true;
      break;
    }
  }

  for (const s of safezoneyellow) {
    if (Math.hypot(s.x - x, s.y - y) < s.size / 2) {
      inSafeZone = true;
      break;
    }
  }

  if (!inSafeZone) {
    gems.push({
      x,
      y,
      size: 30
    });
  }
}
  

}

function startGamewith(type) {
  return type === 'blueRectCircle' || type === 'redCircle' || type === 'yellowTriangleCircle';

}

createWorld();


app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
    console.log('User connected ' + socket.id );
   socket.on('inBush', (state) => {
  backendplayers[socket.id].inBush = state;
});
    socket.on('respawn', () => {
      backendplayers[socket.id] = {
    x: 0,
    y: 0,
    type: null,
    inBush: false,
    invisible: false
  };
      io.emit('remakePlayer' ,socket.id)
    });
    socket.on('death', () => {
  delete backendplayers[socket.id];
  io.emit('removePlayer', socket.id);
});

  

    
    socket.emit('ActualisationGems/Bushes', {
      bushes,
      gems,
      safezoneblue, 
      safezonered, 
      safezoneyellow
    });

    socket.emit('refuge', { bushes });

    backendplayers[socket.id] = {
      x: 0,
      y: 0,
      type: null,
      inBush: false
    };

    socket.emit('updatePlayers', backendplayers);

    socket.on('collectGem', (data) => {
      const index = data.index;

      if (gems[index]) {
        gems.splice(index, 1);

        gems.push({
          x: Math.random() * 5000,
          y: Math.random() * 2200,
          size: 30
        });
      }
    });

    socket.on('move', (data) => {
      const player = backendplayers[socket.id];
      if (!player) return;

      player.x = data.x;
      player.y = data.y;
      player.inBush = data.inBush;
      player.type = data.type;
      player.invisible = data.invisible;
    });

    socket.on('disconnect', () => {
        delete backendplayers[socket.id];
    });
});




setInterval(() => {
  
  io.emit('updatePlayers', backendplayers);
}, 50);


setInterval(() => {
  io.emit('ActualisationGems/Bushes', {
    gems,
    bushes,
    safezoneblue,
    safezonered,
    safezoneyellow
  });
}, 100);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log("Serveur lancé sur " + PORT);
});