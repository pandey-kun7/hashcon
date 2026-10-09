import fs from 'fs'
import path from 'path';

export async function moveFilesWhenServerAdded(lastServerKey, currentServerKey, NODES){
    const KEYS = JSON.parse(await fs.promises.readFile('./KEYS.json','utf-8'));

    const destFolderIndex = NODES.findIndex((node)=>(
        BigInt(node['hashkey']) === currentServerKey
    ));

    if(destFolderIndex === -1){
        throw new Error('No such destination folder');
        // return; // unreachable
    }

    for(let  i = 0 ; i < KEYS.length ; i++){
        if(BigInt(KEYS[i]['hashkey']) >= lastServerKey + 1 && BigInt(KEYS[i]['hashkey']) <= currentServerKey ){
            const destination = path.join(NODES[destFolderIndex]['path'], KEYS[i]['filename'])
            await fs.promises.rename(KEYS[i]['path'] , destination);
            KEYS[i]['path'] = destination;
        }
    }

    await fs.promises.writeFile('./KEYS.json',JSON.stringify(KEYS, null ,2));
}

export function moveFilesWhenServerRemoved(latestFile, currentserverKey){
       
}