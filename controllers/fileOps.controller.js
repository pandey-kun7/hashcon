import { HashFunc } from "../hashFn.js";
import path from 'path'
import fs from 'fs'
import { redisClient } from "../redis/redis.js";
import { ADD_FILES_TO_NODES } from "../redis/scripts.js";

export const uploadFileToServer = async (req, res) => {
    try{
        const { fileName } = req.params;
        const  fileBuffer  = req.body;

        if (!Buffer.isBuffer(fileBuffer)) {
            return res.status(400).json({
            success: false,
            message: "Expected raw binary file data"
            });
        }

        const fileHashKey = HashFunc(fileName);

        const KEYS = JSON.parse(await fs.promises.readFile('./KEYS.json','utf-8'));
        let isFilePresent = KEYS.findIndex((key)=>{
            if(key['hashkey'] === fileHashKey){
                return true;
            }
            return false;
        })

        if(isFilePresent !== -1){
            res.status(400).json({
                success : true,
                message: 'FileName Already exists'
            })
            return;
        }

        const result = await redisClient.eval(ADD_FILES_TO_NODES, {
            keys : [fileHashKey]
        });

        console.log(result)

        if (!result || result[0] === -1) {
            return res.status(500).json({
                success: false,
                message: 'No storage nodes available'
            });
        }

        const destination = path.join(result[1], fileName);

        await fs.promises.mkdir(result[1], { recursive: true });
        await fs.promises.writeFile(destination, fileBuffer);

        const fileInfo = {
            'hashkey' : fileHashKey,
            'name' : fileName,
            'path' : destination
        }

        KEYS.push(fileInfo);

        KEYS.sort((a,b)=>{
            let A = BigInt(a['hashkey']);
            let B = BigInt(b['hashkey']);

            return A > B ? -1 : A < B ? 1 : 0;
        })

        await fs.promises.writeFile('./KEYS.json',JSON.stringify(KEYS, null ,2));

        res.status(200).json({
                success: true,
                bytesReceived: fileBuffer.length
        });

        return;
    }catch(err){
        console.error('Problem in uploadFileToServer',err);
        res.status(500).json({
            success : false,
            message : 'Server Fatt Gya'
        })
    }
}

// export const fetchFileFromServer = async (req, res) => {
//     try{
        
//     }catch(err){
//         console.error('Problem in uploadFileToServer',err);
//         res.status(500).json({
//             success : false,
//             message : 'Server Fatt Gya'
//         })
//     }
// }