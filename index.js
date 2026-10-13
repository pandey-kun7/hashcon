import express from 'express'
import cors from 'cors'
import fs from 'fs'
import { ClientReqRouter } from './routes/application.route.js';

const app = express();

app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(cors({origin : "*"}));
app.use('/',ClientReqRouter)

app.listen(8000,()=>{
    console.log(`Server on the run mfs!!!`)
})