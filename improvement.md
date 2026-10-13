# Improvement: Concurrency Limitations and Redis Integration

## Summary
This document reviews concurrent and distributed limitations of the current codebase (which uses local JSON files for node/key state) and proposes a practical Redis-based approach to make the consistent-hashing system safe and reliable in distributed environments. No code changes are made here — this is an architectural and operational recommendation.

## Current concurrent limitations (observed / likely)
- Single-process local state: `KEYS.json` and `NODE.json` are stored locally; concurrent processes and other machines cannot share a canonical view.
- Race conditions on topology changes: simultaneous add/remove node operations can produce lost updates and inconsistent rings.
- Non-atomic multi-step operations: computing token placement, writing state, and notifying others are separate steps and not atomic.
- No notification mechanism: clients and server instances are unaware of topology updates until they reload local files.
- No durable event log: there's no durable history to replay or recover from partial updates.
- No coordination/leader election: no safe way to coordinate rebalancing or runs that must be performed by a single actor.
- Hotspots & imbalance risks: without virtual nodes or coordinated token placement, load imbalance can occur under scale.

## Goals for distributed operation
- Provide a single canonical topology source that all nodes and clients can consult.
- Ensure topology updates (add/remove nodes, token assignment) are atomic and observable.
- Notify all interested parties promptly on topology change.
- Support fault-tolerant storage and recovery.
- Keep key lookup fast and low-latency.

## How Redis helps (high-level)
- Centralized, fast state store accessible by all processes and machines.
- Suitable data types for consistent hashing: `ZSET` (sorted set) to model ring tokens, `HASH` for node metadata.
- Atomic operations via Lua scripting (`EVAL`) or transactions (`WATCH` + `MULTI`/`EXEC`).
- Pub/Sub for immediate notifications of topology changes.
- Streams for durable, replayable event logs representing topology events.
- Distributed locks (e.g. RedLock pattern) for coordination when necessary.
- Persistence (AOF/RDB), replication, and clustering for HA and scaling.

## Recommended Redis data model
- `ch:nodes` (ZSET) — mapping from token (score) -> node id (member). Use token numeric value as score.
- `ch:node:<nodeId>` (HASH) — node metadata (address, capacity, virtual node count, last-seen, etc.).
- `ch:keys` (optional HASH or STREAM) — key placement or event stream for key migrations; depending on design, you might not store keys here, only compute routing on the fly.
- `ch:topology:events` (STREAM) — append-only event log for adding/removing nodes and rebalances.
- `ch:topology:channel` (Pub/Sub channel) — for immediate notifications to watchers.

## Integration patterns and steps (minimal, safe)
1. Replace local JSON usage with Redis reads/writes: do reads from `ch:nodes` and `ch:node:<id>` instead of `NODE.json`.
2. Node addition (atomic): use a Lua script to
   - generate token(s) for the node,
   - `ZADD ch:nodes` for each token,
   - `HSET ch:node:<nodeId>` with metadata,
   - `XADD ch:topology:events` the add event,
   - `PUBLISH ch:topology:channel` a short notification.
   All of this in a single `EVAL` ensures atomicity and avoids races.
3. Node removal (atomic): Lua script to
   - `ZREM` the node tokens from `ch:nodes`,
   - delete or mark `ch:node:<nodeId>`,
   - append event to stream and `PUBLISH` notification.
4. Key lookup logic (read path):
   - compute `hash(key)` locally,
   - `ZRANGEBYSCORE ch:nodes hashValue +inf LIMIT 0 1` to find the first node whose token >= hashValue;
   - if none, wrap and get the lowest token with `ZRANGE ch:nodes 0 0`.
   These are single read commands — low-latency.
5. Key migration / rebalancing:
   - Use Lua scripts to compute the affected key ranges and perform moves where appropriate; or record migration events in `ch:topology:events` and have workers perform migration idempotently.
6. Notifications & local caches:
   - Subscribe to `ch:topology:channel` to receive topology updates and refresh any local caches.
   - For reliable replay after restart, also read the `ch:topology:events` stream from an offset.
7. Coordination when needed:
   - For operations that must be single-run (e.g., global rebalancing), use distributed lock via `SET resource_name myid NX PX <ttl>` or RedLock libraries; prefer Lua when the whole operation can be expressed server-side.

## Atomicity and concurrency strategies
- Prefer server-side Lua scripts whenever an operation spans multiple keys. Lua scripts are executed atomically by Redis.
- For optimistic concurrency on multi-step client operations, use `WATCH` + `MULTI`/`EXEC` and retry on failure.
- Use idempotent operations and event-based retries for migration tasks.
- Use small, well-defined critical sections with locks only for coordination-required tasks; avoid long-held locks.

## Example pseudo-commands (illustrative)
- Add node tokens (simplified):
  - `EVAL <lua> 0` where lua: generate tokens -> `ZADD ch:nodes <token> <nodeId>` -> `HSET ch:node:<nodeId> address <addr>` -> `XADD ch:topology:events * type add node <nodeId> tokens <...>` -> `PUBLISH ch:topology:channel "node-added:<nodeId>"`
- Lookup node for key:
  - `ZRANGEBYSCORE ch:nodes <hash> +inf LIMIT 0 1` then fallback to `ZRANGE ch:nodes 0 0`.

## Rebalancing and virtual nodes
- Use many virtual node tokens per physical node to smooth distribution (tune based on expected node count and churn).
- When adding/removing nodes, record migration events rather than attempting to synchronously move all keys; let workers migrate keys asynchronously and idempotently.

## Migration / rollout plan (safe phased approach)
1. Stand up Redis (single instance) and implement read-only Redis adapter in a test branch to read ring from Redis while keeping JSON files unchanged.
2. Start publishing topology updates to `ch:topology:channel` from a control process (simulated) and observe clients subscribing.
3. Switch a small percentage of lookups to use Redis-backed routing and validate correctness under load and failure.
4. Implement atomic add/remove via Lua scripts and test concurrent operations.
5. Migrate write-paths (add/remove) to Redis scripts and retire JSON writes.
6. Gradually decommission local JSON state, keeping the new Redis stream as the audit log.

## Testing and verification
- Run concurrent node add/remove stress tests to confirm no lost updates.
- Simulate partial failures (process crash mid-op) and ensure system recovers by replaying `ch:topology:events`.
- Validate that subscribers receive and apply topology updates within acceptable latency.
- Measure lookup latency for `ZRANGEBYSCORE` and tune local caches if needed.

## Operational considerations
- High availability: run Redis Cluster or Redis with replication + sentinel for fault tolerance.
- Persistence: enable AOF for durability if topology must survive crashes.
- Security: enable ACLs and TLS, restrict access to trusted hosts.
- Monitoring: track `ch:nodes` size, event stream length, command latency, and slowlog entries.

## Tradeoffs and caveats
- Centralizing topology in Redis introduces a single external dependency; mitigate with HA/replication.
- Pub/Sub is fire-and-forget (not durable). Use Streams (or Streams + consumer groups) for durable processing.
- Lua scripts must be designed carefully to avoid long-running scripts that block the Redis server.
- For extremely high update rates, tune virtual node count and shard responsibilities.

## Conclusion and next steps
- Integrate Redis as the canonical topology store using `ZSET` + `HASH` + `STREAM` + `PUB/SUB` and use Lua scripts for atomic multi-key operations.
- Build adapters: read-only adapter first, then write-path via Lua scripts, then subscribers to refresh local caches.
- Run thorough concurrent and failover tests before switching production traffic.

---
Notes: this file intentionally avoids changing the repository code. If you want, I can draft example Lua scripts and a minimal Redis adapter in a separate branch for hands-on testing.
