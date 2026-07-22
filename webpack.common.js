const path = require('path');

module.exports = {
  entry: {
    app: './js/src/main.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    filename: './js/app.js',
  },
};
