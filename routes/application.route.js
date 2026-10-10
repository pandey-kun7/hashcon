import express from 'express'
import { FileRecieveMiddleware } from '../middleware/acceptFile.js'
import { uploadFileToServer } from '../controllers/fileOps.controller.js'
import { getServerNode } from '../controllers/server.controller.js';

const router = express()

router.put('/sendfile/:fileName', FileRecieveMiddleware, uploadFileToServer);
router.get('/get-server-nodes',getServerNode)

export const ClientReqRouter = router