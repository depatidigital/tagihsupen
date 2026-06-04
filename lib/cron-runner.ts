import { startCronJobs } from './cron'

startCronJobs()

process.on('SIGTERM', () => process.exit(0))
process.on('SIGINT', () => process.exit(0))
