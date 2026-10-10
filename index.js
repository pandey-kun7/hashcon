import express from 'express'
import cors from 'cors'
import fs from 'fs'



const NODES = JSON.parse(await fs.promises.readFile('./NODE.json', 'utf-8'));

for(let i = 0 ; i < NODES.length ; i++){
    let node = NODES[i];
    try{
        const app = express();

        app.use(express.urlencoded({extended: false}));
        app.use(express.json());
        app.use(cors({origin : "*"}));
        app.listen(node['url']['port'], node['url']['host'],()=>{
            console.log(`Server - ${node['name']} on the run mfs!!!`)
        })
        continue;
    }catch(err){
        console.log(err.message);
    }
}