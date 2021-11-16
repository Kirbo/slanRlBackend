module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps: [
    {
      name: "Slan Roguelike",
      script: "ts-node",
      args: "src/index.ts",
      watch: false,
      max_restarts: 0,
      autorestart: true,
      restart_delay: 1000,
      max_memory_restart: "120M",
      interpreter: "node@14.18.1",
    },
  ],
};
