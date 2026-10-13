import fs from "fs"
import { HashFunc, POOL_SIZE } from "./hashFn.js";
import { ServerNode } from "./serverNodeClass.js";
import { moveFilesWhenServerAdded, moveFilesWhenServerRemoved } from "./fileOptions.js";
import { redisClient } from "./redis/redis.js";
import { DELETE_SERVER_NODE } from "./redis/scripts.js";

async function createServer(serverName, folderName, host, port){
    const hashedKey = HashFunc(serverName+ host + port);

    const resultParams = await ServerNode.ServerNode_(serverName, folderName, host, port, hashedKey);

    if( resultParams && resultParams.length > 1){
        const LastServerKey = resultParams[1];
        const CurrServerKey = resultParams[2];
        const CurrServerPath = resultParams[3];
    
        moveFilesWhenServerAdded(LastServerKey,CurrServerKey, CurrServerPath);

    }else{
        console.log("We couldn't make it :(")
    }

}

async function removeServer(serverName, port, host){

    const hashedKey = HashFunc(serverName+ host + port);

    const result = await redisClient.eval(DELETE_SERVER_NODE, {
        keys: [hashedKey.toString()]
    })

    console.log(result)

    if(result[0] == -1){
        console.log("Cant delete the server");
        return;
    }else{
        moveFilesWhenServerRemoved(result[1], result[2]);
    }

}

// createServer('Puronik', 'Beta', '192.168.0.104', 8002);
// createServer('Wellkamine', 'Gamma', '192.168.0.104', 8003);
// createServer('Semi', 'Zeta', '192.168.0.104', 8004);
// createServer('Zeno', 'Pi', '192.168.0.104', 8005);
// createServer('Astick', 'Alpha', '192.168.0.104', 8001);

// removeServer('Astick',8001, "192.168.0.104");
// removeServer('Puronik',8002, "192.168.0.104");
// removeServer('Wellkamine',8003, "192.168.0.104");
//  removeServer('Semi',8004, "192.168.0.104");