const roomId = localStorage.getItem('roomId');
const dealerId = localStorage.getItem('dealerId');
const socket = io('/');

//toast
const liveToast = document.getElementById('liveToast');
const contentToast = document.getElementById('contentToast');

//list player
const playerList = document.getElementById('player-list');

//dealer
const dealer = document.getElementById('dealer');
const dealerName = document.getElementById('dealer-name');
const listDealerCard = document.getElementById('list-dealer-card-item');
const distributeCardButton = document.getElementById('distributeCard');
const plugOutCardButton = document.getElementById('plugOutCard');
const openBetButton = document.getElementById('openBet');
const playAgainButton = document.getElementById('playAgain');

const showToast = (contentToShow) => {
  contentToast.innerHTML = contentToShow;
  liveToast.className += ' show';
  setTimeout(() => {
    liveToast.className = 'toast';
  }, 2000);
};

socket.emit('join-room', roomId, dealerId);
data.dealer.joinRoomIo = true;

socket.on('player-connection', (player) => {
  const { playerId, playerName, curCards, bet } = player;

  const existPlayer = data.players.find((element) => {
    return element.playerId === +playerId;
  });

  if (existPlayer === undefined) {
    data.players.push(player);
    const playerItem = `
        <li class="list-group-item col-md-2 col-xl-3 list-player-item" id="${playerId}-player">
              <h5
              class="notification-turn"
              id="${playerId}-notification-turn"
              >
              </h5>
              <div class="every-teammate">
                <div class="header-item d-flex justify-content-center">
                <div class="w-75 clearfix">
                    <p class="float-start" 
                    style="
                    color: white;
                    font-size: 1.2rem;
                    font-weight: 600;
                    font-style: italic;
                  ">${playerName}</p>
                    <p class="float-end" style="color: white" id="${playerId}-bet">Cược : ${bet}</p>
                </div>
                </div>
                <div class="body-item" id="${playerId}-list-card">
                </div>
                <div
                class="check-card-player"
                id="${playerId}-check-card-player"
                style="display: none;"
                >
                  <img src="/assets/img/eye-regular.svg" alt="" style="width: 20px;" />
                  <p class="content-check-card-player">Xét bài</p>
                </div>
            </div>
        </li>
      `;
    playerList.innerHTML += playerItem;
  }
});

openBetButton.addEventListener('click', () => {
  socket.emit('open-bet', roomId);
  showToast('Bạn đã mở cược');
});

socket.on('player-bet', (playerId, bet) => {
  const player = data.players.find((element) => {
    return +element.playerId === +playerId;
  });
  const playerDom = document.getElementById(`${playerId}-player`);
  playerDom.className += ' bet-done-player';
  player.bet = +bet;
  document.getElementById(`${playerId}-bet`).innerHTML = 'Cược : ' + bet;
});

socket.on('player-bet-done', () => {
  showToast('Cược xong, có thể phát bài');
  distributeCardButton.disabled = false;
});

distributeCardButton.addEventListener('click', () => {
  socket.emit('distribute-card', roomId);
  distributeCardButton.disabled = true;
  openBetButton.disabled = true;
});

socket.on('receive-card-first', (dealer, players) => {
  data.dealer = dealer;
  data.players = players;

  let listDealerCardItem = '';

  dealer.curCards.forEach((element) => {
    listDealerCardItem = `
      <li class="list-group-item col-2 list-dealer-card-item">
        <div class="item">
          <img src="/assets/img/${element}.png" alt="" class="card-item-img" />
        </div>
      </li>`;
    listDealerCard.innerHTML += listDealerCardItem;
  });

  let listPlayerCard = null;
  let listPlayerCardItem = '';
  players.forEach((element) => {
    const playerDom = document.getElementById(`${element.playerId}-player`);
    playerDom.className = playerDom.className.replace(' bet-done-player', '');
    listPlayerCard = document.getElementById(`${element.playerId}-list-card`);
    element.curCards.forEach((element) => {
      listPlayerCardItem = `<img src="/assets/img/0.png" alt="" class="player-card-item" />`;
      listPlayerCard.innerHTML += listPlayerCardItem;
    });
  });

  setTimeout(() => {
    socket.emit('allow-plug-out-card', roomId);
  }, 2000);
});

socket.on('turn-plug-out', (previousTurnPlayerId, turnCurrentPlayerId) => {
  if (previousTurnPlayerId !== null) {
    const previousPlayer = document.getElementById(
      `${previousTurnPlayerId}-player`
    );
    previousPlayer.className = previousPlayer.className.replace(
      ' turn-player',
      ''
    );
    document.getElementById(
      `${previousTurnPlayerId}-notification-turn`
    ).innerHTML = '';
    const player = data.players.find((element) => {
      return element.playerId === +previousTurnPlayerId;
    });
    player.turnPlugOut = false;
  }
  if (+dealerId === +turnCurrentPlayerId) {
    data.dealer.turnPlugOut = true;
    dealer.className += ' turn-dealer';
    dealerName.className += ' turn-dealer';
    plugOutCardButton.disabled = false;
    playAgainButton.disabled = false;
    showToast('Lượt rút của bạn ');
    handleEventCheckCardPlayer();
    //Add event check card player when turn plug out of dealer
  } else {
    const player = data.players.find((element) => {
      return element.playerId === +turnCurrentPlayerId;
    });
    player.turnPlugOut = true;
    const playerDom = document.getElementById(`${turnCurrentPlayerId}-player`);
    playerDom.className += ' turn-player';
    const notification = document.getElementById(
      `${turnCurrentPlayerId}-notification-turn`
    );
    notification.innerHTML = 'Lượt người chơi';
  }
});

const handleEventCheckCardPlayer = () => {
  let listPlayerCard;
  let checkCardPlayer;
  data.players.forEach((element) => {
    listPlayerCard = document.getElementById(`${element.playerId}-list-card`);
    checkCardPlayer = document.getElementById(
      `${element.playerId}-check-card-player`
    );
    listPlayerCard.addEventListener('mouseenter', () => {
      if (element.checkedCard === false) {
        document.getElementById(`${element.playerId}-list-card`).style.display =
          'none';
        document.getElementById(
          `${element.playerId}-check-card-player`
        ).style.display = 'flex';
      }
    });

    checkCardPlayer.addEventListener('mouseleave', () => {
      document.getElementById(`${element.playerId}-list-card`).style.display =
        'flex';
      document.getElementById(
        `${element.playerId}-check-card-player`
      ).style.display = 'none';
    });

    checkCardPlayer.addEventListener('click', () => {
      socket.emit('dealer-check-card-of-player', roomId, element.playerId);
      let cardItem = '';
      element.curCards.forEach((card) => {
        cardItem += `<img src="/assets/img/${card}.png" alt="" class="player-card-item" />`;
      });

      document.getElementById(`${element.playerId}-list-card`).innerHTML =
        cardItem;
      element.checkedCard = true;
      document.getElementById(`${element.playerId}-list-card`).style.display =
        'flex';
      document.getElementById(
        `${element.playerId}-check-card-player`
      ).style.display = 'none';
    });
  });
};

socket.on('plug-out-card-for-user', (userId, card) => {
  let cardItem;
  if (+dealerId === +userId) {
    data.dealer.curCards.push(card);
    cardItem = `
    <li class="list-group-item col-2 list-dealer-card-item">
      <div class="item">
        <img
          src="/assets/img/${card}.png"
          alt=""
          class="card-item-img"
        />
      </div>
    </li>`;
    listDealerCard.innerHTML += cardItem;
  } else {
    const player = data.players.find((element) => {
      return element.playerId === +userId;
    });
    player.curCards.push(card);
    cardItem = `<img src="/assets/img/0.png" alt="" class="player-card-item" />`;
    document.getElementById(`${userId}-list-card`).innerHTML += cardItem;
  }
});

plugOutCardButton.addEventListener('click', () => {
  const dealer = data.dealer;
  if (dealer.curCards.length === 4) {
    showToast('Đã đủ 5, hãy xét bài');
    plugOutCardButton.disabled = true;
  }
  socket.emit('plug-out-card', roomId, dealerId);
});

playAgainButton.addEventListener('click', () => {
  socket.emit('play-again', roomId);
  showToast('Đang tạo ván mới');
  playAgainButton.disabled = true;
});

socket.on('play-again-success', (dealerReset, playersReset) => {
  data.dealer = dealerReset;
  data.players = playersReset;

  //setup for dealer
  plugOutCardButton.disabled = true;
  openBetButton.disabled = false;
  listDealerCard.innerHTML = '';
  dealer.className = dealer.className.replace(' turn-dealer', '');

  //setup for players
  data.players.forEach((player) => {
    document.getElementById(`${player.playerId}-list-card`).innerHTML = '';
    document.getElementById(`${player.playerId}-bet`).innerHTML = 'Cược : 0';
  });
});
