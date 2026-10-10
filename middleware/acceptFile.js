import express from 'express'

const app = express.raw({ type: "application/octet-stream", limit: "100mb" })

export const FileRecieveMiddleware = app;