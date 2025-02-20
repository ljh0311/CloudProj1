module.exports = {
  apps: [{
    name: 'kappy',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      MYSQL_HOST: 'database1.czsa24cac7y5.us-east-1.rds.amazonaws.com',
      MYSQL_USER: 'admin',
      MYSQL_PASSWORD: 'KappyAdmin',
      MYSQL_DATABASE: 'kappy_db',
      NEXTAUTH_URL: 'http://54.159.253.0:3000',
      NEXTAUTH_SECRET: 'Kappy-Super-Secret',
      NEXT_PUBLIC_API_URL: 'http://54.159.253.0:3000/api'
    },
    max_memory_restart: '500M',
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    time: true,
    instances: 1,
    autorestart: true,
    watch: false,
    max_restarts: 10,
    restart_delay: 4000
  }]
} 