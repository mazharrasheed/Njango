export default {
  DEBUG: true,
  PORT: 3000,

  DATABASE: 'db.sqlite3',


  INSTALLED_APPS: [
    'apps/blog/urls.js'
  ],

  ALLOWED_ORIGINS : [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://myfrontend.example.com"
],


  TEMPLATE_DIR: './templates',


  STATIC_DIR: './static'
};

