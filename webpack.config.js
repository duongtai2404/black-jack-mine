const path = require('path');

module.exports = {
  entry: {
    dealer: './public/script/sub-script/dealer.js',
    player: './public/script/sub-script/player.js',
    home: './public/script/sub-script/home.js',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'public/dist'),
  },
  mode: 'production',
};
