module.exports = {
  apps: [{
    name: "hrms",
    script: "./dist/index.cjs",
    env: {
      NODE_ENV: "production",
      PORT: 5000
    },
    instances: 1,
    exec_mode: "fork",
    autorestart: true,
    watch: false,
    max_memory_restart: "1G",
    error_file: "./logs/error.log",
    out_file: "./logs/output.log",
    log_file: "./logs/combined.log",
    time: true
  }]
};
