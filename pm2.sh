env $(< environment) pm2 start index.js --watch \
    --ignore-watch='db'
