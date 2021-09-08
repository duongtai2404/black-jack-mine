const roomId = localStorage.getItem('roomId');
const currentPlayerId = localStorage.getItem('playerId');
var currentPlayer = data.players.find((element) => {
  return element.playerId === +currentPlayerId;
});

const socket = io('/');

//toast
const liveToast = document.getElementById('liveToast');
const contentToast = document.getElementById('notification-toast');

//list player
const playerList = document.getElementById('player-list');

//current player
const currentPlayerDom = document.getElementById(`current-player`);
const listCurrentPlayerCard = document.getElementById(
  'list-current-player-card'
);
const betButton = document.getElementById('bet');
const betInput = document.getElementById('betInput');
const infoBet = document.getElementById('infoBet');
const plugOutButton = document.getElementById('btnPlugOut');
const doneButton = document.getElementById('btnDone');

//dealer
const listDealerCard = document.getElementById('list-dealer-card');
const dealer = document.getElementById('dealer');

const showToast = (contentToShow) => {
  contentToast.innerHTML = contentToShow;
  liveToast.className += ' show';
  setTimeout(() => {
    liveToast.className = 'toast';
  }, 2000);
};

socket.emit('join-room', roomId, currentPlayerId);
currentPlayer.joinRoomIo = true;

socket.on('player-connection', (player) => {
  const { playerId, playerName, curCards, bet } = player;
  const existPlayer = data.players.find((element) => {
    return element.playerId === +playerId;
  });

  if (existPlayer === undefined) {
    data.players.push(player);
    const playerItem = `
    <li
    class="
      list-group-item
      col-md-2 col-lg-3 col-xl-3
      list-player-item
    "
    id="${playerId}-player"
    >
      <h5
        class="notification-turn"
        id="${playerId}-notification-turn-player"
      >
      </h5>
      <div class="every-teammate">
        <div class="header-item d-flex justify-content-center">
          <div class="w-75 clearfix">
            <p
              class="float-start"
              style="
                color: white;
                font-size: 1.2rem;
                font-weight: 600;
                font-style: italic;
              "
            >
              ${playerName}
            </p>
            <p
              class="float-end"
              id="${playerId}-bet"
              style="color: white"
            >
              Cược : ${bet}
            </p>
          </div>
        </div>
        <div class="body-item" id="${playerId}-list-card">
        </div>
        <div
          class="check-card-player"
          id="${playerId}-check-card-player"
          style="display: none;"
        >
          <img
            src="/assets/img/eye-regular.svg"
            alt=""
            style="width: 20px"
          />
          <p class="content-check-card-player">Xét bài</p>
        </div>
      </div>
    </li>`;
    playerList.innerHTML += playerItem;
  }
});

socket.on('allow-bet', () => {
  betButton.disabled = false;
  showToast('Nhà cái đã mở cược');
});

//handle-bet
betButton.addEventListener('click', () => {
  if (Number.isNaN(betInput.value) || +betInput.value <= 0) {
    showToast('Mức cược là số và lớn hơn 0');
    return;
  }
  const bet = +betInput.value;
  socket.emit('bet', roomId, currentPlayerId, bet);
  infoBet.innerHTML = 'Bạn đã cược : ' + bet;
  if (currentPlayer.bet === 0) {
    currentPlayerDom.className += ' current-player-bet-done';
  }
  currentPlayer.bet = bet;
});

socket.on('player-bet', (playerId, bet) => {
  const player = data.players.find((element) => {
    return +element.playerId === +playerId;
  });
  if (player.bet === 0) {
    const playerDom = document.getElementById(`${playerId}-player`);
    playerDom.className += ' player-bet-done';
  }
  player.bet = +bet;

  document.getElementById(`${playerId}-bet`).innerHTML = 'Cược : ' + bet;
});

socket.on('receive-card-first', (dealer, players) => {
  data.dealer = dealer;
  data.players = players;
  currentPlayer = data.players.find((element) => {
    return element.playerId === +currentPlayerId;
  });

  let listDealerCardItem = '';
  dealer.curCards.forEach((element) => {
    listDealerCardItem = `
    <li class="card-list__item">
    <img
      src="/assets/img/0.png"
      alt=""
      class="card-list__item-img"
    />
  </li>`;
    listDealerCard.innerHTML += listDealerCardItem;
  });

  let playerListCard = null;
  let listCurrentPlayerCardItem = '';
  players.forEach((element) => {
    if (element.playerId !== +currentPlayerId) {
      const playerDom = document.getElementById(`${element.playerId}-player`);
      playerDom.className = playerDom.className.replace(' player-bet-done', '');
      playerListCard = document.getElementById(`${element.playerId}-list-card`);
      let cardItem = `
      <img src="/assets/img/0.png" alt="" class="player-card-item" />
      <img src="/assets/img/0.png" alt="" class="player-card-item" />`;
      playerListCard.innerHTML += cardItem;
      addEventSeeCardPlayer(element);
    } else {
      currentPlayerDom.className = currentPlayerDom.className.replace(
        ' current-player-bet-done',
        ''
      );
      betButton.disabled = true;
      betInput.disabled = true;
      element.curCards.forEach((element) => {
        listCurrentPlayerCardItem = `
            <li class="card-list__item">
              <img
                src="/assets/img/${element}.png"
                alt=""
                class="card-list__item-img"
              />
            </li>`;
        listCurrentPlayerCard.innerHTML += listCurrentPlayerCardItem;
      });
    }
  });
});

socket.on('turn-plug-out', (previousTurnPlayerId, turnPlayerId) => {
  if (
    previousTurnPlayerId !== null &&
    +previousTurnPlayerId !== +currentPlayerId
  ) {
    const previousPlayer = document.getElementById(
      `${previousTurnPlayerId}-player`
    );
    previousPlayer.className = previousPlayer.className.replace(
      ' turn-player',
      ''
    );
    document.getElementById(
      `${previousTurnPlayerId}-notification-turn-player`
    ).innerHTML = '';
    const player = data.players.find((element) => {
      return element.playerId === +previousTurnPlayerId;
    });
    player.turnPlugOut = false;
  }
  if (data.dealer.dealerId === +turnPlayerId) {
    data.dealer.turnPlugOut = true;
    dealer.className += ' turn-dealer';
    showToast('Lượt của cái');
  } else {
    const player = data.players.find((element) => {
      return element.playerId === +turnPlayerId;
    });
    player.turnPlugOut = true;
    if (+turnPlayerId === +currentPlayerId) {
      currentPlayerDom.className += ' turn-current-player';
      plugOutButton.disabled = false;
      doneButton.disabled = false;
      showToast('Lượt rút của bạn');
    } else {
      const playerDom = document.getElementById(`${turnPlayerId}-player`);
      playerDom.className += ' turn-player';
      document.getElementById(
        `${turnPlayerId}-notification-turn-player`
      ).innerHTML = 'Lượt người chơi';
    }
  }
});

plugOutButton.addEventListener('click', () => {
  if (currentPlayer.curCards.length === 4) {
    showToast('Đã đủ 5, nhấn thôi để kết thúc');
    plugOutButton.disabled = true;
  }
  socket.emit('plug-out-card', roomId, currentPlayerId);
});

socket.on('plug-out-card-for-user', (userId, card) => {
  let cardItem;
  if (data.dealer.dealerId === +userId) {
    data.dealer.curCards.push(card);
    cardItem = `
    <li class="card-list__item">
      <img
        src="/assets/img/0.png"
        alt=""
        class="card-list__item-img"
      />
    </li>`;
    listDealerCard.innerHTML += cardItem;
  } else {
    if (+currentPlayerId === +userId) {
      currentPlayer.curCards.push(card);
      cardItem = `
      <li class="card-list__item">
        <img
          src="/assets/img/${card}.png"
          alt=""
          class="card-list__item-img"
          style="height: 112px"
        />
      </li>`;
      listCurrentPlayerCard.innerHTML += cardItem;
    } else {
      const player = data.players.find((element) => {
        return element.playerId === +userId;
      });
      player.curCards.push(card);
      if (player.seen === true) {
        cardItem = `<img src="/assets/img/${card}.png" alt="" class="player-card-item" />`;
      } else {
        cardItem = `<img src="/assets/img/0.png" alt="" class="player-card-item" />`;
      }
      document.getElementById(`${userId}-list-card`).innerHTML += cardItem;
    }
  }
});

doneButton.addEventListener('click', () => {
  plugOutButton.disabled = true;
  doneButton.disabled = true;
  currentPlayerDom.className = currentPlayerDom.className.replace(
    ' turn-current-player',
    ''
  );
  socket.emit('done-plug-out', roomId, currentPlayerId);
});

const addEventSeeCardPlayer = (element) => {
  const listPlayerCard = document.getElementById(
    `${element.playerId}-list-card`
  );
  const checkCardPlayer = document.getElementById(
    `${element.playerId}-check-card-player`
  );
  listPlayerCard.addEventListener('mouseenter', () => {
    if (element.seen !== true) {
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
    const listCard = document.getElementById(`${element.playerId}-list-card`);
    let cardItem = '';
    element.curCards.forEach((card) => {
      cardItem += `<img src="/assets/img/${card}.png" alt="" class="player-card-item" />`;
    });
    listCard.innerHTML = cardItem;
    element.seen = true;
  });
};

socket.on('dealer-checked-card', (playerId) => {
  const player = data.players.find((element) => element.playerId === +playerId);
  player.checkedCard = true;
  if (+playerId === +currentPlayerId) {
    let cardItem = '';
    data.dealer.curCards.forEach((card) => {
      cardItem += `
      <li class="card-list__item">
        <img
          src="/assets/img/${card}.png"
          alt=""
          class="card-list__item-img"
        />
      </li>`;
    });
    listDealerCard.innerHTML = cardItem;
    showToast('Cái đã xét bài bạn');
  }
});

socket.on('play-again-success', (dealerReset, playersReset) => {
  showToast('Đang tạo ván mới ..');
  data.dealer = dealerReset;
  data.players = playersReset;

  //setup for dealer
  dealer.className = dealer.className.replace(' turn-dealer', '');
  listDealerCard.innerHTML = '';

  //setup for players
  data.players.forEach((player) => {
    if (+player.playerId !== +currentPlayerId) {
      document.getElementById(`${player.playerId}-list-card`).innerHTML = '';
      document.getElementById(`${player.playerId}-bet`).innerHTML = 'Cược : 0';
    }
  });

  //setup for current player
  infoBet.innerHTML = '';
  betInput.disabled = false;
  betInput.value = 0;
  listCurrentPlayerCard.innerHTML = '';
});
