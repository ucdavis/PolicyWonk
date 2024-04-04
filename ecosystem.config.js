module.exports = {
  apps: [
    {
      name: 'policywonk-app',
      script: 'npm',
      args: 'run serve',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
