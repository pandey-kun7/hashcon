import fs from 'fs'

export const getServerNode = async (req, res)=>{
    try{
        const NODES = JSON.parse(await fs.promises.readFile('./NODE.json','utf-8'));
        res.status(200).json({
            success: true,
            message: 'Get them all!',
            data : NODES
        })
        return;
    }catch(err){
        console.log(err);
        res.status(500).json({
            message: 'Interval Server Error',
            success : false
        })
    }
}