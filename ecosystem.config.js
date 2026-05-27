module.exports = {
  apps: [
    {
      name: "santisoft-automatizacion",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      instances: "max",
      exec_mode: "cluster",
      env: {
        PORT: 3003,
        NODE_ENV: "production"
      }
    }
  ]
};
