import express, { json } from "express"
import cors from "cors"
import { MongoClient } from "mongodb"
import dotenv from "dotenv"
import dayjs from "dayjs"
import Joi from "joi"


const app = express()
app.use(cors())
app.use(express.json())
dotenv.config()

const mongoClient = new MongoClient(process.env.DATABASE_URL)

let db


mongoClient.connect()

    .then(() => db = mongoClient.db())
    .catch((erro) => console.log(erro))


const participantSchema = Joi.object({
    name: Joi.string().required(),

})

const messageSchema = Joi.object({
    to: Joi.string().required(),
    text: Joi.string().required(),
    type: Joi.string().required()
})

app.post('/participants', async (req, res) => {

    const { name } = req.body

    const validation = participantSchema.validate(req.body, { abortEarly: false })
    if (validation.error) {
        const errors = validation.error.details.map((det) => det.message);
        return res.status(422).send(errors);
    }

    try {

        const entry = {
            from: name,
            to: 'Todos',
            text: 'entra na sala...',
            type: 'status',
            time: dayjs().format('HH:mm:ss')
        }

        console.log(entry)

        const existName = await db.collection('participants').findOne({ name })

        if (existName) return res.status(409).send("Nome ja cadastrado, por favor tente outro !")
        if (!name) return res.status(422).send("O nome deve ser prenchido !!")

        const newParticipant = {
            name,
            lastStatus: Date.now()
        }

        await db.collection("participants").insertOne(newParticipant)
        await db.collection("messages").insertOne(entry)

        res.status(201).send(newParticipant)
    } catch (erro) {

        console.log(erro)
    }

})

app.get('/participants', async (req, res) => {

    const participants = await db.collection("participants").find().toArray()

    if (participants.length === 0) return res.send(participants)

    try {

        res.send(participants)

    } catch (erro) { return console.log(erro.message) }

})


app.post('/messages', async (req, res) => {

    const { text, to, type } = req.body
    const User = req.headers.user;


    const validation = messageSchema.validate(req.body, { abortEarly: false })

    if (validation.error) {
        const errors = validation.error.details.map((det) => det.message);
        return res.status(422).send(errors);
    }

    const existName = await db.collection('messages').findOne({ to })
    console.log(existName)
    if (!existName) return res.status(422).send("Não encontrado")



    try {

        const newMessage = {
            from: User,
            to,
            text,
            type,
            time: dayjs().format('HH:mm:ss')
        }

        await db.collection("messages").insertOne(newMessage)


        res.sendStatus(201)

    } catch (erro) {
        return console.log(erro)
    }

})

app.get('/messages', async (req, res) => {


    try {
        const messages = await db.collection("massages").find().toArray()

        console.log(messages)
        res.status(201).send(messages)

    } catch (erro) { return res.sendStatus(422) }

})

const server = (5000)
app.listen(server, () => console.log(`Servidor funcionando na porta ${server}`))