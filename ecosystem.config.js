module.exports = {
  apps: [{
    name: 'kappy',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
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