require('dotenv').config();
const webpack = require('webpack');

module.exports = {
  plugins: [
    new webpack.DefinePlugin({
    'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL),
    'process.env.SUPABASE_SERVICE_KEY': JSON.stringify(process.env.SUPABASE_SERVICE_KEY),
    'process.env.DEEPSEEK_API_KEY': JSON.stringify(process.env.DEEPSEEK_API_KEY),
      // Add more variables as needed
    }),
  ],
};
