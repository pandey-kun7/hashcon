import fs from "fs"
import crypto from "crypto"

export class ServerNode{

    static async ServerNode_(serverName, folderName, host, port, hashedKey){
        const NODES = JSON.parse(await fs.promises.readFile('./NODE.json','utf-8'));

        const alreadyPresent = NODES.findIndex((node)=>{
            if(BigInt(node['hashkey']) === hashedKey || node['url']['port'] === port || node['name'] === serverName){
                return true;
            }
            return false;
        })

        if(alreadyPresent!== -1){
            throw Error('Already present name, port');
        }

        const newNodeInfo = {
            'hashkey' : hashedKey.toString(),
            'name' : serverName,
            'dirname' : folderName,
            'url' : {
                host,
                port
            },
            'path' : `C:\\Users\\Administrator\\projects\\consistent-hashing\\server_dir\\${folderName}`
        };

        NODES.push(newNodeInfo);

        fs.mkdir(newNodeInfo['path'],()=>{
            console.log(`${newNodeInfo['name']} made !!`)
        })

        NODES.sort((a,b)=>{
            BigInt(a['hashkey']) > BigInt(b['hashkey']) ? -1 : BigInt(a['hashkey']) < BigInt(b['hashkey']) ? 0 : 1 ;
        });


        await fs.promises.writeFile('./NODE.json',JSON.stringify(NODES, null, 2));

        return NODES;

        console.log('Server node added successfully');
    }
}