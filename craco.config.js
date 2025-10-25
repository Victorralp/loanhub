const path = require('path');

module.exports = {
  style: {
    postcss: {
      mode: 'extends',
      loaderOptions: {
        postcssOptions: {
          ident: 'postcss',
          plugins: [
            require('tailwindcss')(path.resolve(__dirname, 'tailwind.config.js')),
            require('autoprefixer'),
          ],
        },
      },
    },
  },
};
