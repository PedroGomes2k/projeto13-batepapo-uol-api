import express, { json } from "express"
import cors from "cors"
import { MongoClient } from "mongodb"
import dotenv from "dotenv"

const app = express()
app.use(cors())
app.use(express.json())
dotenv.config()

const mongoClient = new MongoClient(process.env.DATABASE_URL)

let db


mongoClient.connect()

    .then(() => db = mongoClient.db())
    .catch((erro) => console.log(erro))


app.post('/participants', async (req, res) => {

    const { name } = req.body

    try {

        const existName = await db.collection('participants').findOne({ name })

        if (existName) return res.status(409).send("Nome ja cadastrado, por favor tente outro !")
        if (!name) return res.status(422).send("O nome deve ser prenchido !!")

        const novoParticipante = {
            name,
            lastStatus: Date.now()
        }

        await db.collection("participants").insertOne(novoParticipante)

        res.status(201).send(novoParticipante)
    } catch (erro) {

        console.log(erro)
    }

})

app.get('/participants', (req, res) => {

    db.collection("participants").find().toArray()

        .then((result) => { res.send(result) })
        .catch((erro) => { return console.log(erro.message) })

})


app.post('/messages', (req, res) => {

    const { to, text, type } = req.body

    if (to === "" || text === "" || type !== "private_message" || type !== "message") {
        return res.sendStatus(422)
    }


    res.sendStatus(201)
})

app.get('/messages', (req, res) => {

})

const server = (5000)
app.listen(server, () => console.log(`Servidor funcionando na porta ${server}`))