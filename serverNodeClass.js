import fs from "fs"
import crypto from "crypto"
import { redisClient } from './redis/redis.js'
import { ADD_NODE_LUA_SCRIPT } from "./redis/scripts.js"

export class ServerNode{

    static async ServerNode_(serverName, folderName, host, port, hashedKey){
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

        return result;

    }
}