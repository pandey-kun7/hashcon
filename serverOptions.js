import fs from "fs"
import { HashFunc } from "./hashFn.js";
import { ServerNode } from "./serverNodeClass.js";
import { moveFilesWhenServerAdded, moveFilesWhenServerRemoved } from "./fileOptions.js";

async function createServer(serverName, folderName, host, port){
    const NODES = JSON.parse(await fs.promises.readFile('./NODE.json','utf-8'));

    const hashedKey = HashFunc(serverName+ host + port);

    console.log(hashedKey)

    let alreadyPresent = false;

    for(const node of NODES){
        if(BigInt(node['hashkey']) === hashedKey){
            alreadyPresent = true;
            break;
        }
    }

    if(alreadyPresent){
        throw new Error('Server key already exists');
        return;
    }

    let newNodeList = await ServerNode.ServerNode_(serverName, folderName, host, port, hashedKey);

    let newNodeListPrevIndex = 0;
    let newNodeListCurrIndex = 0;

    for(let i = 0 ; i < newNodeList.length ; i++){
        const node = newNodeList[i];
        if(BigInt(node['hashkey']) === hashedKey){
            if(i !== 0 ){
                newNodeListPrevIndex = i - 1; 
                newNodeListCurrIndex = i;
                break
            }
        }
    }

    const LastServerKey = BigInt( newNodeList[newNodeListPrevIndex]['hashkey']);
    const CurrServerKey = BigInt( newNodeList[newNodeListCurrIndex]['hashkey']);

    moveFilesWhenServerAdded(LastServerKey,CurrServerKey, newNodeList);
}

async function removeServer(serverName,port){
    const NODES = JSON.parse(await fs.promises.readFile('./NODE.json','utf-8'));

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

    let newNodeList = NODES.splice(removedNodeIndex, 1);

    await fs.promises.writeFile('./NODE.json',JSON.stringify(NODES, null, 2));

    const newServerKey = BigInt(newNodeList[removedNodeIndex]['hashkey']);

    moveFilesWhenServerRemoved(newServerKey, removedServerPath, newNodeList);
}

// createServer('Puronik', 'Beta', '10.08.98.97', 8002);

removeServer('Astick',8001);