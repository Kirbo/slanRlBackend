module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps: [
    {
      name: "Slan Roguelike",
      script: "dist/index.js",
      watch: false,
      max_restarts: 0,
      autorestart: true,
      restart_delay: 1000,
      max_memory_restart: "120M",
    },
  ],
};
