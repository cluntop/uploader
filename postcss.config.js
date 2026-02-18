export default {
  plugins: {
    'postcss-import': {},
    '@tailwindcss/postcss': {},
    'postcss-preset-env': {
      features: {
        'nesting-rules': false
      }
    },
    autoprefixer: {},
    cssnano: {
      preset: 'default'
    }
  }
}