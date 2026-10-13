# hashcon

> A distributed file storage coordinator built with a **Consistent Hashing** architecture, **Redis-backed Lua scripts** for atomic ring operations, and **automatic dynamic file rebalancing**.

---

## 📖 Overview

**hashcon** is a lightweight distributed file storage engine that maps files to storage nodes over a circular hash ring of size **$2^{256}$**. Instead of relying on conventional modulo-based routing (which requires relocating nearly all keys when cluster capacity changes), hashcon ensures that adding or removing a node only migrates a minimal fraction of files ($K/N$ on average).

The system uses **Redis** as a centralized ring coordinator and topology registry, executing custom **Lua scripts** for atomic, race-condition-free ring lookups, node insertions, and node evictions.

---

## 🏛️ Architecture & Core Mechanics

### 1. Consistent Hashing Ring ($2^{256}$ Keyspace)
Both storage nodes (derived from `serverName + host + port`) and uploaded files (derived from `fileName`) are mapped onto a continuous circular keyspace spanning $[0, 2^{256} - 1]$ using cryptographic **SHA-256** and native JavaScript `BigInt`.

### 2. Clockwise Successor Lookup
When a file is uploaded, the coordinator queries Redis. A Lua script executes a clockwise traversal on the sorted ring to find the first node with a `hash >= fileHash`. If the file's hash exceeds all active nodes, it wraps around to the lowest-hash node on the ring.

### 3. Dynamic Data Rebalancing ($K/N$)
- **Node Provisioning**: When a new node joins the cluster, only keys falling within its specific circular partition are migrated from the predecessor/successor node (`moveFilesWhenServerAdded`).
- **Node Decommissioning**: When a node is removed, its files are safely transferred to its successor node on the ring (`moveFilesWhenServerRemoved`) before the node's record is pruned from Redis.

---

## ✨ Key Features

- **$2^{256}$ SHA-256 Hash Ring**: Built with cryptographic SHA-256 and native JavaScript `BigInt` for high-entropy distribution and near-zero collision probability.
- **Atomic Operations via Redis Lua**: Ring traversals, binary insertions, and node evictions run in single-cycle atomic Redis Lua scripts, eliminating race conditions across concurrent uploads.
- **Dynamic File Rebalancing**: Automated file migration (`moveFilesWhenServerAdded` / `moveFilesWhenServerRemoved`) preserves data integrity during topology adjustments.
- **Non-Blocking Asynchronous I/O**: File operations utilize Node.js `fs.promises` (`readFile`, `writeFile`, `rename`, `mkdir`) for performant streaming and file persistence.
- **Clean RESTful API & Web Client**: Intuitive raw binary upload endpoint (`PUT /sendfile/:fileName`) paired with a minimal HTML5/JS web dashboard.

---

## 📂 Project Structure

```text
hashcon/
├── client/
│   ├── index.html                  # Web client interface
│   └── script.js                   # Client upload controller
├── controllers/
│   └── fileOps.controller.js       # File upload & Redis ring resolution
├── middleware/
│   └── acceptFile.js               # Binary octet-stream upload parser
├── redis/
│   ├── redis.js                    # Redis client connection configuration
│   └── scripts.js                  # Redis Lua scripts (Seek, Delete, Add)
├── routes/
│   └── application.route.js        # Express application routing
├── server_dir/                     # Physical storage directories for nodes
│   ├── Alpha/
│   ├── Beta/
│   └── Gamma/
├── fileOptions.js                  # Automated file migration routines
├── hashFn.js                       # SHA-256 modulo-2^256 hashing utility
├── index.js                        # Express server entry point
├── KEYS.json                       # Catalog tracking uploaded file metadata
├── NODE.json                       # Topology snapshot of registered nodes
├── serverNodeClass.js              # ServerNode class & Lua ring insertion
└── serverOptions.js                # Cluster node provisioning CLI utilities
```

---

## ⚡ Under the Hood: Redis & Lua Scripts

hashcon offloads cluster synchronization and ring state to Redis. All critical ring lookups are written in Lua:

| Script | Purpose | Complexity |
| :--- | :--- | :--- |
| `ADD_NODE_LUA_SCRIPT` | Inserts a node into the sorted `nodes` list in the proper hash order and registers hash attributes. | $O(N)$ |
| `ADD_FILES_TO_NODES` | Traverses the ring to identify the successor node for a file key (with wrap-around). | $O(N)$ |
| `DELETE_SERVER_NODE` | Atomically removes a node from the ring, deletes its hash table, and returns the successor path for file evacuation. | $O(N)$ |

---

## 🚀 Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- A running [Redis](https://redis.io/) instance (local or cloud-hosted)

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/hashcon.git
cd hashcon
npm install
```

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD="your_redis_password_if_any"
```

### 4. Running the Coordinator Server

Start the API gateway:

```bash
npm start
```
The server will boot up at `http://localhost:8000`.

---

## 🛠️ Managing Nodes

Node management is controlled via `serverOptions.js`:

### Add a Node to the Cluster
```javascript
import { createServer } from './serverOptions.js';

// Provision a new storage node (name, folderName, host, port)
await createServer('Puronik', 'Beta', '127.0.0.1', 8002);
```
*This places the node on the ring, creates its directory under `server_dir/`, and moves existing partition files from the prior node to the new node.*

### Remove a Node from the Cluster
```javascript
import { removeServer } from './serverOptions.js';

// Evacuate and decommission a node
await removeServer('Puronik', 8002, '127.0.0.1');
```
*This evacuates all files from `Beta` to its successor node on the ring before removing it from Redis.*

---

## 📤 Uploading Files

### Via Web Client
Open `client/index.html` in your browser, pick a file, and click **Upload file**. The file will automatically be routed to the appropriate storage node folder according to its hash.

### Via cURL
Send any binary file directly to the API:

```bash
curl -X PUT http://localhost:8000/sendfile/document.pdf \
     -H "Content-Type: application/octet-stream" \
     --data-binary "@document.pdf"
```

Response:
```json
{
  "success": true,
  "bytesReceived": 1048576
}
```

---

## 🧰 Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules)
- **Framework**: [Express 5](https://expressjs.com/)
- **Distributed State**: [Redis 6+](https://redis.io/) + [node-redis](https://github.com/redis/node-redis)
- **Scripting**: Lua (Redis embedded scripts)
- **Hashing**: SHA-256 with BigInt arithmetic
- **File System**: `node:fs/promises`
