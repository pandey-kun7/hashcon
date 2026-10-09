import fs from "fs"
import { HashFunc } from "./hashFn";
import { ServerNode } from "./serverNodeClasss";

async function createServer(serverName, folderName, host, port){
    const NODES = await fs.promises.readFile('./NODE.json','utf-8');
    const KEYS = await fs.promises.readFile('./KEYS.json','utf-8');

    const hashedKey = HashFunc(serverName+ host + port);

    let alreadyPresent = false;

    for(const node of NODES){
        if(node['hashkey'] === hashedKey){
            alreadyPresent = true;
            break;
        }
    }

    if(alreadyPresent){
        throw new Error('Server key already exists');
        return;
    }

    let newNodeList = ServerNode(serverName, folderName, host, port);

    const newNodeListPrev = 



    moveFiles(lastestKeygreaterthanthecurrentServer,currentserverKey);

}