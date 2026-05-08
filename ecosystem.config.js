module.exports = {
  apps : [{
    name: "bngroup-api",
    script: "./dist/server.js",
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/bngroup-api-error.log',
    out_file: './logs/bngroup-api-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
    }
  }]
};