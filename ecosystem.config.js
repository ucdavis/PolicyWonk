module.exports = {
  apps: [
    {
      name: 'policywonk-app',
      script: 'npm',
      args: 'serve',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
