import fs from "fs"
import { HashFunc, POOL_SIZE } from "./hashFn.js";
import { ServerNode } from "./serverNodeClass.js";
import { moveFilesWhenServerAdded, moveFilesWhenServerRemoved } from "./fileOptions.js";
import { redisClient } from "./redis/redis.js";
import { DELETE_SERVER_NODE } from "./redis/scripts.js";

async function createServer(serverName, folderName, host, port){
    // const NODES = JSON.parse(await fs.promises.readFile('./NODE.json','utf-8'));

    const hashedKey = HashFunc(serverName+ host + port);

    // console.log(hashedKey)

    // let alreadyPresent = false;

    // for(const node of NODES){
    //     if((node['hashkey']) === hashedKey){
    //         alreadyPresent = true;
    //         break;
    //     }
    // }

    // if(alreadyPresent){
    //     throw new Error('Server key already exists');
    //     return;
    // }

    await ServerNode.ServerNode_(serverName, folderName, host, port, hashedKey);

    const newNodeList = redisClient.call("HGET", nodes);

    let newNodeListPrevIndex = 0;
    let newNodeListCurrIndex = 0;

    for(let i = 0 ; i < newNodeList.length ; i++){
        const node = newNodeList[i];
        if((node['hashkey']) === hashedKey){
            if(i !== 0 ){
                newNodeListPrevIndex = i - 1; 
                newNodeListCurrIndex = i;
                break
            }
        }
    }

    const LastServerKey = ( newNodeList[newNodeListPrevIndex]['hashkey']);
    const CurrServerKey = ( newNodeList[newNodeListCurrIndex]['hashkey']);

    moveFilesWhenServerAdded(LastServerKey,CurrServerKey, newNodeList);
}

async function removeServer(serverName, port, host){

    const hashedKey = HashFunc(serverName+ host + port);

    const result = await redisClient.eval(DELETE_SERVER_NODE, {
        keys: [hashedKey.toString()]
    })

    console.log(result)

    const NODES = JSON.parse(await fs.promises.readFile('./NODE.json','utf-8'));
    if(result[0] == -1){
        console.log("Cant delete the server");
        return;
    }else{
        moveFilesWhenServerRemoved(result[1], result[2], NODES);
    }


    const removedNodeIndex  = NODES.findIndex((node)=>{
        if(node['url']['port'] === port && node['name'] === serverName){
            return true;
        }
        return false;
    })

    
    if(removedNodeIndex === -1){
        throw new Error('No such server exists');
    }

    const removedServerPath = NODES[removedNodeIndex]['path']

    if(NODES.length <= 1){
        throw new Error('Cannot remove the only or no server');
    }

    
    let nextServerIndex = -1 ;
    for(let i = removedNodeIndex+1 ; i < NODES.length ; i++){
        nextServerIndex = i;
        break;
    }
    
    if(nextServerIndex === -1){
        nextServerIndex = 0;
    }
    
    console.log(nextServerIndex);
    const newServerKey = (NODES[nextServerIndex]['hashkey']);
    
    let newNodeList = NODES.splice(removedNodeIndex, 1);
    await fs.promises.writeFile('./NODE.json',JSON.stringify(NODES, null, 2));

    if(nextServerIndex > removedNodeIndex){
        nextServerIndex = nextServerIndex -1;
    }

    moveFilesWhenServerRemoved(nextServerIndex, removedServerPath, NODES);
}

// createServer('Puronik', 'Beta', '192.168.0.104', 8002);
// createServer('Wellkamine', 'Gamma', '192.168.0.104', 8003);
// createServer('Astick', 'Alpha', '192.168.0.104', 8001);

// removeServer('Puronik',8002, "192.168.0.104");
// removeServer('Astick',8001, "192.168.0.104");
removeServer('Wellkamine',8003, "192.168.0.104");