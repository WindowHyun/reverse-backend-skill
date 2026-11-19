// Old overdue-notice worker, replaced by the Bull queue
export function startLegacyWorker() {
  console.log('legacy worker started');
  // TODO: poll the loans table and send overdue notices
}
