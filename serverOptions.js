import fs from "fs"
import { HashFunc } from "./hashFn";
import { ServerNode } from "./serverNodeClasss";
import { moveFilesWhenServerAdded } from "./fileOptions";

async function createServer(serverName, folderName, host, port){
    const NODES = JSON.parse(await fs.promises.readFile('./NODE.json','utf-8'));
    const KEYS = JSON.parse(await fs.promises.readFile('./KEYS.json','utf-8'));

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