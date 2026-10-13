export const DELETE_SERVER_NODE = `
local key = KEYS[1]
local hashKey = "nodes:" .. key

local hashServer = redis.call("EXISTS", hashKey)

if hashServer == 0 then
    return {-1}
end

local numOfServers = redis.call("LLEN", "nodes")

if numOfServers <= 1 then
    return {-1}
end

local toBeRemovedServerIndex = 0

local nodesLen = redis.call("LLEN", "nodes")

for i = 0 , nodesLen -1 do
    local intermediateHash = redis.call("LINDEX", "nodes", i)
    if intermediateHash == key then
        toBeRemovedServerIndex = i
        break
    end
end

local toBeRemovedServerPath = redis.call("HGET", hashKey, "path")

local nextServerIndex = toBeRemovedServerIndex+1

if toBeRemovedServerIndex == nodesLen -1 then
nextServerIndex = 0
end

local nextServerKey = redis.call("LINDEX", "nodes", nextServerIndex)
local nextServerHashKey = "nodes:" .. nextServerKey

local nextServerPath = redis.call("HGET", nextServerHashKey, "path")

redis.call("LREM", "nodes", 0 , key)
redis.call("DEL", hashKey)

return {1, nextServerPath, tostring(toBeRemovedServerPath)}
`

export const ADD_FILES_TO_NODES = `
local function greaterHashVal(a, b)
    if #a ~= #b then
        return #a > #b
    end
    return a > b
end

local key = KEYS[1]

local nodeIndex = -1
local nodeLen = redis.call("LLEN", "nodes")

if nodeLen < 1 then
    return {-1}
end

if nodeLen > 0 then
    for i = 0, nodeLen -1 do
        local currNodeHash = redis.call("LINDEX", "nodes", i)
        if greaterHashVal(currNodeHash, key) then
            nodeIndex = i
            break
        end
    end
end

if nodeIndex == -1 then
    nodeIndex = 0
end

local chosenNodeHashKey = redis.call("LINDEX", "nodes", nodeIndex)
local chosenNodeKey = "nodes:" .. chosenNodeHashKey
local chosenNodePath = redis.call("HGET", chosenNodeKey, "path")

return {1, chosenNodePath}
`

export const ADD_NODE_LUA_SCRIPT = `
local function greaterHashVal(a, b)
    if #a ~= #b then
        return #a > #b
    end

    return a > b
end

local key = KEYS[1]
local serverName = ARGV[1]
local folderName = ARGV[2]
local host = ARGV[3]
local port = ARGV[4]
local path = ARGV[5]


local redisKey = "nodes:" .. key

if redis.call("EXISTS", redisKey) == 1 then
    return {-1}
end

redis.call("HSET", redisKey , "name", serverName, "dirname", folderName, "url:port", port, "url:host", host,  "path", path);

local insertIndex = -1

local nodes = redis.call("LLEN", "nodes")

if nodes > 0 then
    for i = 0 , nodes-1 do
        local intermediateHash = redis.call('LINDEX', "nodes", i)
        if greaterHashVal(intermediateHash, key) then
            insertIndex = i
            break
        end
    end
end

if insertIndex == -1 then
    local prevServerHashKey = redis.call("LINDEX", "nodes", nodes-1) 
    redis.call("RPUSH", "nodes", key)
    return {1, prevServerHashKey, key, path}
end

local hashAtTargetIndex = redis.call("LINDEX", "nodes", insertIndex)

redis.call("LINSERT", "nodes", "BEFORE", hashAtTargetIndex, key)

return {1, hashAtTargetIndex, key, path}
`