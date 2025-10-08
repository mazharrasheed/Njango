export default {
  DEBUG: true,
  PORT: 3000,
  DATABASE: 'db.sqlite3',
  INSTALLED_APPS: [
    'apps/blog/urls.js'
  ],
  TEMPLATE_DIR: './templates',
  STATIC_DIR: './static'
};