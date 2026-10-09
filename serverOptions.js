import fs from "fs"
import { HashFunc } from "./hashFn";
import { ServerNode } from "./serverNodeClass";
import { moveFilesWhenServerAdded, moveFilesWhenServerRemoved } from "./fileOptions";

async function createServer(serverName, folderName, host, port){
    const NODES = JSON.parse(await fs.promises.readFile('./NODE.json','utf-8'));

    const hashedKey = HashFunc(serverName+ host + port);

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

    let newNodeList = ServerNode(serverName, folderName, host, port);

    let newNodeListPrevIndex = 0;
    let newNodeListCurrIndex = 0;
    for(const index in newNodeList){
        if(BigInt(newNodeList[index]['hashkey']) === hashedKey){
            if(index !== 0 ){
                newNodeListPrevIndex = index - 1; 
                newNodeListCurrIndex = index;
                break
            }
        }
    }

    const LastServerKey = BigInt(newNodeList[newNodeListPrevIndex]['hashkey']);
    const CurrServerKey = BigInt(newNodeList[newNodeListCurrIndex]['hashkey']);

    moveFilesWhenServerAdded(LastServerKey,CurrServerKey, newNodeList);
}

async function removeServer(serverName,port){
    const NODES = JSON.parse(await fs.promises.readFile('./NODE.json','utf-8'));

    const [removedServerPath, removedNodeIndex] = NODES.findIndex((node,index)=>{
        if(node['port'] === port && node['name'] === serverName){
            return [BigInt(node['hashedkey']) , index];
        }
    })

    if(removedServerPath === -1){
        throw new Error('No such server exists');
    }

    if(NODES.length <= 1){
        throw new Error('Cannot remove the only or no server');
    }

    let newNodeList = NODES.splice(removedNodeIndex, 1);

    await fs.promises.writeFile('./NODE.json',JSON.stringify(newNodeList, null, 2));

    const newServerKey = BigInt(newNodeList[removedNodeIndex]['hashkey']);

    moveFilesWhenServerRemoved(newServerKey, removedServerPath, newNodeList);
}