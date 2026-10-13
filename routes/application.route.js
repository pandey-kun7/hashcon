import express from 'express'
import { FileRecieveMiddleware } from '../middleware/acceptFile.js'
import { uploadFileToServer } from '../controllers/fileOps.controller.js'

const router = express()

router.put('/sendfile/:fileName', FileRecieveMiddleware, uploadFileToServer);

export const ClientReqRouter = router