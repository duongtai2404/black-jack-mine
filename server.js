const express = require('express');
const app = express();
const httpServer = require('http').Server(app);
const io = require('socket.io')(httpServer);
const cors = require('cors');
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 3000;
const ioController = require('./controllers/io.controller');

const createCards = () => {
  let cards = [];
  for (let index = 1; index < 53; index++) {
    cards.push(index);
  }
  return cards;
};

const CARDS = createCards();

const gameStore = new Map();
//{roomId : {dealer: dealerId , players : []}}

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.redirect('/home');
});

app.get('/login', (req, res) => {
  return res.render('view-test/login');
});

app.get('/home', (req, res) => {
  return res.render('view-test/home');
});

const canGoRoom = (req, res, next) => {
  const userId = req.query.id;
  const userName = req.query.name;
  if (!userId || !userName) {
    return res.render('view-test/home');
  } else {
    req.userId = userId;
    req.userName = userName;
    return next();
  }
};

app.get('/room/:roomId', canGoRoom, (req, res) => {
  const userId = +req.userId;
  const userName = req.userName;
  const roomId = +req.params.roomId;

  //check if don't have room, create room, and dealer is person send request
  if (!gameStore.has(roomId)) {
    gameStore.set(roomId, {
      dealer: {
        dealerId: userId,
        dealerName: userName,
        curCards: [],
        joinRoomIo: false,
        turnPlugOut: false,
      },
      players: [],
      cards: CARDS.slice(),
      peopleBet: 0,
    });

    const data = {
      dealer: {
        dealerId: userId,
        dealerName: userName,
        curCards: [],
        turnPlugOut: false,
      },
      roomId: roomId,
      players: [],
    };
    return res.render('view-test/dealer', { data });
  } else {
    //if have room, return information room
    const { dealer, players } = gameStore.get(roomId);
    if (dealer.dealerId === userId) {
      const data = {
        dealer: dealer,
        roomId: roomId,
        players: players,
      };
      return res.render('view-test/dealer', { data: data });
    } else {
      const player = players.find((element) => {
        return element.playerId === userId;
      });

      if (player === undefined) {
        players.push({
          playerId: userId,
          playerName: userName,
          curCards: [],
          bet: 0,
          joinRoomIo: false,
          turnPlugOut: false,
          checkedCard: false,
        });
      }
      const data = {
        dealer,
        players,
        roomId,
        curPlayer: userId,
      };
      return res.render('view-test/player', { data: data });
    }
  }
});

ioController(io, gameStore);

httpServer.listen(PORT, () => {
  console.log(`Server is listening at http://localhost:${PORT}`);
});
