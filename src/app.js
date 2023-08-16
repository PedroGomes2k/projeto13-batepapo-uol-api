import express, { json } from "express"
import cors from "cors"

const app = express()

app.use(cors())
app.use(express.json())





const server = (5000)
app.listen(server, () => console.log(`Servidor funcionando na porta ${server}`))