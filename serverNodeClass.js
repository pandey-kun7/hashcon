import fs from "fs"
import crypto from "crypto"

export class ServerNode{

    static async ServerNode(serverName, folderName, host, port, hashedKey){
        const NODES = JSON.parse(await fs.promises.readFile('./NODE.json','utf-8'));

        const newNodeInfo = {
            'hashkey' : String(hashedKey),
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