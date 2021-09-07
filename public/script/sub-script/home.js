localStorage.removeItem('dealerId');
localStorage.removeItem('playerId');
localStorage.removeItem('roomId');
const userName = localStorage.getItem('name');

document.getElementById('hello').innerHTML =
  'Xin chào : ' + `<span style="color: red;">${userName}<span>`;

const createRoomButton = document.getElementById('createRoom');
createRoomButton.onclick = () => {
  const dealerId = Math.floor(10000 + Math.random() * 90000);
  const roomId = Math.floor(100000 + Math.random() * 900000);

  localStorage.setItem('dealerId', dealerId);
  localStorage.setItem('roomId', roomId);

  window.location.replace(
    `${host}/room/${roomId}?id=${dealerId}&name=${userName}`
  );
};

const enterRoom = document.getElementById('enterRoom');
enterRoom.addEventListener('click', (e) => {
  const roomId = document.getElementById('roomId').value;
  const playerId = Math.floor(10000 + Math.random() * 90000);

  localStorage.setItem('roomId', roomId);
  localStorage.setItem('playerId', playerId);

  window.location.replace(
    `${host}/room/${roomId}?id=${playerId}&name=${userName}`
  );
});
