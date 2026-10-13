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

local nextServerIndex = toBeRemovedServerIndex

if toBeRemovedServerIndex == nodesLen -1 then
    nextServerIndex = 0
end

redis.call("LREM", "nodes", 0 , key)
redis.call("DEL", hashKey)

return {1, nextServerIndex, tostring(toBeRemovedServerPath)}
`