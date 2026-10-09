import fs from "fs"
import crypto from "crypto"

export class ServerNode{

    static POOL_SIZE = BigInt(Math.pow(2,256));

    static HashFunc(str, totalKeys = POOL_SIZE){
        const hash = crypto.createHash('sha-256').update(str).digest('hex');
        const hashedKey = BigInt('0x' + hash);
        const mod = hashedKey % BigInt(totalKeys);
        return mod;
    }

    static async ServerNode(serverName, folderName, host, port, hashedKey){
        const NODES = await fs.promises.readFile('./NODE.json','utf-8');

        const newNodeInfo = {
            'hashkey' : hashedKey,
            'name' : serverName,
            'dirname' : folderName,
            'url' : {
                host,
                port
            }
        };

        NODES.push(newNodeInfo);

        NODES.sort((a,b)=>{
            return a['hashkey'] < b['hashkey'];
        });

        await fs.promises.writeFile('./NODE.json',JSON.stringify(NODES, null, 2));

        return NODES;

        console.log('Server node added successfully');
    }
}