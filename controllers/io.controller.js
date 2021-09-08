const createCards = () => {
  let cards = [];
  for (let index = 1; index < 53; index++) {
    cards.push(index);
  }
  return cards;
};

const CARDS = createCards();
const distributeCard = (roomInfo) => {
  const { dealer, players, cards } = roomInfo;
  let cardForDealer = randomTwoCard(cards);
  dealer.curCards = cardForDealer.slice();
  players.forEach((element) => {
    let cardForPlayer = randomTwoCard(cards);
    element.curCards = cardForPlayer.slice();
  });
};

//card = [1,2,3,..,52]
const randomTwoCard = (cards) => {
  const arrayCard = [];
  for (let index = 0; index < 2; index++) {
    let index = randomNumber(cards.length);
    arrayCard.push(cards[index]);
    cards.splice(index, 1);
  }
  return arrayCard;
};

const randomNumber = (length) => {
  return Math.floor(Math.random() * length);
};

const plugOutOneCard = (cards) => {
  const index = randomNumber(cards.length);
  const card = cards[index];
  cards.splice(index, 1);
  return card;
};

module.exports = (io, gameStore) => {
  io.on('connect', (socket) => {
    socket.on('join-room', (roomId, playerId) => {
      const roomIdNumber = +roomId;
      if (gameStore.has(roomIdNumber)) {
        const roomInfo = gameStore.get(roomIdNumber);
        socket.join(roomIdNumber);

        if (roomInfo.dealer.dealerId === +playerId) {
          //if dealer does not join room, join room and set joinRoomIo = true
          roomInfo.dealer.joinRoomIo = true;
        } else {
          //if player does not join room, join room and set joinRoomIo = true

          const player = roomInfo.players.find((element) => {
            return element.playerId === +playerId;
          });
          player.joinRoomIo = true;
          socket.to(roomIdNumber).emit('player-connection', player);
        }
      }
    });

    socket.on('open-bet', (roomId) => {
      socket.to(+roomId).emit('allow-bet');
    });

    socket.on('bet', (roomId, playerId, bet) => {
      socket.to(+roomId).emit('player-bet', playerId, bet);
      const roomInfo = gameStore.get(+roomId);
      const players = roomInfo.players;
      const player = players.find((element) => {
        return element.playerId === +playerId;
      });
      if (player.bet === 0) {
        roomInfo.peopleBet += 1;
        if (roomInfo.peopleBet === roomInfo.players.length) {
          socket.to(+roomId).emit('player-bet-done');
        }
      }
      player.bet = +bet;
    });

    socket.on('distribute-card', (roomId) => {
      const roomInfo = gameStore.get(+roomId);
      distributeCard(roomInfo);
      const { dealer, players } = roomInfo;
      io.to(+roomId).emit('receive-card-first', dealer, players);
    });

    socket.on('allow-plug-out-card', (roomId) => {
      const roomInfo = gameStore.get(+roomId);
      const firstPlayer = roomInfo.players[0];
      firstPlayer.turnPlugOut = true;
      io.to(+roomId).emit('turn-plug-out', null, firstPlayer.playerId);
    });

    socket.on('plug-out-card', (roomId, userId) => {
      const { dealer, players, cards } = gameStore.get(+roomId);
      const card = plugOutOneCard(cards);
      if (dealer.dealerId === +userId) {
        dealer.curCards.push(card);
      } else {
        const player = players.find((element) => {
          return element.playerId === +userId;
        });
        player.curCards.push(card);
      }
      io.to(+roomId).emit('plug-out-card-for-user', userId, card);
    });

    socket.on('done-plug-out', (roomId, playerId) => {
      const { dealer, players, cards } = gameStore.get(+roomId);
      if (dealer.dealerId === +playerId) {
        dealer.turnPlugOut = false;
      } else {
        const player = players.find(
          (element) => element.playerId === +playerId
        );
        player.turnPlugOut = false;
        const indexPlayer = players.indexOf(player);
        const nextIndex = indexPlayer + 1;
        if (nextIndex === players.length) {
          dealer.turnPlugOut = true;
          io.to(+roomId).emit('turn-plug-out', playerId, dealer.dealerId);
        } else {
          const nextPlayer = players[nextIndex];
          nextPlayer.turnPlugOut = true;
          io.to(+roomId).emit('turn-plug-out', playerId, nextPlayer.playerId);
        }
      }
    });

    socket.on('dealer-check-card-of-player', (roomId, playerId) => {
      const { players } = gameStore.get(+roomId);
      const player = players.find((element) => element.playerId === +playerId);
      player.checkedCard = true;
      socket.to(+roomId).emit('dealer-checked-card', playerId);
    });

    socket.on('play-again', (roomId) => {
      let { dealer, players, cards, peopleBet } = gameStore.get(+roomId);
      dealer.curCards = [];
      dealer.turnPlugOut = false;
      dealer.joinRoomIo = false;
      peopleBet = 0;
      cards = CARDS.slice();
      players.forEach((player) => {
        player.curCards = [];
        player.bet = 0;
        player.turnPlugOut = false;
        player.checkedCard = false;
        player.joinRoomIo = false;
      });
      const newRoomInfo = {
        dealer,
        players,
        cards,
        peopleBet,
      };
      gameStore.set(+roomId, newRoomInfo);
      io.to(+roomId).emit('play-again-success', dealer, players);
    });
  });
};
