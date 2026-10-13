import fs from 'fs'
import path from 'path';

export async function moveFilesWhenServerAdded(lastServerKey, currentServerKey, currServerpath){
    const KEYS = JSON.parse(await fs.promises.readFile('./KEYS.json','utf-8'));

    for(let  i = 0 ; i < KEYS.length ; i++){
        if((BigInt(KEYS[i]['hashkey']) >= BigInt(lastServerKey )+ 1n) || (BigInt(KEYS[i]['hashkey']) <= BigInt(currentServerKey)) ){
            const destination = path.join(currServerpath, KEYS[i]['name'])
            await fs.promises.rename(KEYS[i]['path'] , destination);
            KEYS[i]['path'] = destination;
            console.log('Moving Files')
        }
    }

    await fs.promises.writeFile('./KEYS.json',JSON.stringify(KEYS, null ,2));
}

export async function moveFilesWhenServerRemoved(destFolderPath, removedServerPath){
    const KEYS = JSON.parse(await fs.promises.readFile('./KEYS.json','utf-8'));

    console.log('destPath', destFolderPath)

    for(let  i = 0 ; i < KEYS.length ; i++){
        if(path.dirname(KEYS[i]['path']) === removedServerPath ){
            const destination = path.join(destFolderPath, KEYS[i]['name'])
            await fs.promises.rename(KEYS[i]['path'] , destination);
            KEYS[i]['path'] = destination;
            console.log('Moving Files')
        }
    }

    await fs.promises.writeFile('./KEYS.json',JSON.stringify(KEYS, null ,2));
}