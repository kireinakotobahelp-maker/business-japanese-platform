module.exports = {
  apps: [
    {
      name: 'kireina-web',
      script: 'npm',
      args: 'run dev',
      cwd: '/home/user/webapp',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      log_file: '/home/user/webapp/logs/combined.log',
      out_file: '/home/user/webapp/logs/out.log',
      error_file: '/home/user/webapp/logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
}