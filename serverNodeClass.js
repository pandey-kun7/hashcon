import fs from "fs"
import crypto from "crypto"
import { redisClient } from './redis/redis.js'


const ADD_NODE_LUA_SCRIPT = `
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
    redis.call("RPUSH", "nodes", key)
    return {1}
end

local hashAtTargetIndex = redis.call("LINDEX", "nodes", insertIndex)

redis.call("LINSERT", "nodes", "BEFORE", hashAtTargetIndex, key)

return {1}
`

export class ServerNode{

    static async ServerNode_(serverName, folderName, host, port, hashedKey){
        const NODES = JSON.parse(await fs.promises.readFile('./NODE.json','utf-8'));

        const path = `C:\\Users\\Administrator\\projects\\consistent-hashing\\server_dir\\${folderName}`

        const result = await redisClient.eval(ADD_NODE_LUA_SCRIPT , {
            keys: [hashedKey],
            arguments : [serverName, folderName, host, port.toString(), path]
        })

        console.log(result)

        if(result[0] === -1){
            console.log('Already present');
            return;
        }else{
            fs.mkdir(path,()=>{
                console.log(`${serverName} made !!`)
            })

            console.log('Server node added successfully');
            
        }

        const alreadyPresent = NODES.findIndex((node)=>{
            if((node['hashkey']) === hashedKey || node['url']['port'] === port || node['name'] === serverName){
                return true;
            }
            return false;
        })

        if(alreadyPresent!== -1){
            throw Error('Already present name, port');
        }

        const newNodeInfo = {
            'hashkey' : hashedKey.toString(),
            'name' : serverName,
            'dirname' : folderName,
            'url' : {
                host,
                port
            },
            'path' : `C:\\Users\\Administrator\\projects\\consistent-hashing\\server_dir\\${folderName}`
        };

        NODES.push(newNodeInfo);

        fs.mkdir(newNodeInfo['path'],()=>{
            console.log(`${newNodeInfo['name']} made !!`)
        })

        NODES.sort((a,b)=>{
            BigInt(a['hashkey']) > BigInt(b['hashkey']) ? -1 : BigInt(a['hashkey']) < BigInt(b['hashkey']) ? 0 : 1 ;
        });


        await fs.promises.writeFile('./NODE.json',JSON.stringify(NODES, null, 2));

        return NODES;

    }
}