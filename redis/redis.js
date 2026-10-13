import {createClient} from "redis"
import "dotenv/config" 

export const redisClient = createClient({
  username: 'default',
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: 'maize-prose-leading-23032.db.redis.io',
    port: 10021,
    // tls: true
  }
});

redisClient.on('error', console.error);

await redisClient.connect();
console.log(await redisClient.ping()); // PONG