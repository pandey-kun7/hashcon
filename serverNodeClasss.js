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
        const NODES = JSON.parse(await fs.promises.readFile('./NODE.json','utf-8'));

        const newNodeInfo = {
            'hashkey' : hashedKey,
            'name' : serverName,
            'dirname' : folderName,
            'url' : {
                host,
                port
            },
            'path' : `C:\\Users\\Administrator\\projects\\consistent-hashing\\server_dir\\${folderName}`
        };

        NODES.push(newNodeInfo);

        NODES.sort((a,b)=>{
            BigInt(a['hashkey']) > BigInt(b['hashkey']) ? -1 : BigInt(a['hashkey']) < BigInt(b['hashkey']) ? 0 : 1 ;
        });

        await fs.promises.writeFile('./NODE.json',JSON.stringify(NODES, null, 2));

        return NODES;

        console.log('Server node added successfully');
    }
}