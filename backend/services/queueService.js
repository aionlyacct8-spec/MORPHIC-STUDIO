import crypto from 'crypto';

const queues = new Map();

function getQueue(name) {
  if (!queues.has(name)) queues.set(name, []);
  return queues.get(name);
}

export function enqueueJob(queueName, payload = {}) {
  const queue = getQueue(queueName);
  const job = {
    id: crypto.randomUUID(),
    queueName,
    payload,
    status: 'queued',
    createdAt: new Date().toISOString(),
  };
  queue.push(job);
  return job;
}

export function getQueueHealth() {
  const names = ['image-gen', 'tts', 'export'];
  const details = names.map(name => {
    const queue = getQueue(name);
    return {
      name,
      provider: process.env.QUEUE_PROVIDER || 'memory',
      waiting: queue.filter(job => job.status === 'queued').length,
      running: queue.filter(job => job.status === 'running').length,
      failed: queue.filter(job => job.status === 'failed').length,
      completed: queue.filter(job => job.status === 'completed').length,
    };
  });
  return {
    provider: process.env.QUEUE_PROVIDER || 'memory',
    redisConfigured: Boolean(process.env.REDIS_URL),
    queues: details,
  };
}
