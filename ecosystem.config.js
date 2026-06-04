module.exports = {
  apps: [
    {
      name: 'tagihsupen-web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        TZ: 'Asia/Jakarta',
      },
    },
    {
      name: 'tagihsupen-cron',
      script: 'node_modules/tsx/dist/cli.mjs',
      args: 'lib/cron-runner.ts',
      env: {
        NODE_ENV: 'production',
        TZ: 'Asia/Jakarta',
      },
    },
  ],
}
