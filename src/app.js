import express, { json } from "express"
import cors from "cors"
import { MongoClient, ObjectId } from "mongodb"
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
    type: Joi.string().valid("message", "private_message").required()
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

    const User = req.headers.user
    let limit = parseInt(req.query.limit)

    try {

        if (limit === 0 || limit <= 0 || limit === "string") return res.status(422).send("erro com o limit")

        const messages = await db.collection("messages").find(
            {
                $or: [{ type: "message", to: User },
                { type: "private_message", from: User },
                { to: "Todos" }]
            }
        ).limit(limit).toArray()

        res.status(200).send(messages)

    } catch (erro) { return res.sendStatus(422) }

})

app.post('/status', async (req, res) => {


    const User = req.headers.user


    try {

        if (!User) return res.status(404).send("User não passado")

        const existName = await db.collection("participants").findOne({ name: User })

        if (User !== existName.name) return res.status(404).send("user é diferente do name")

        await db.collection("participants").updateOne({ name: User }, { $set: { lastStatus: Date.now() } })


        return res.status(201).send("Atualização realizada")

    } catch { return res.status(404).send("Catch") }
})

async function logOut() {

    const time = Date.now()
    const inactive = await db.collection("participants").find().toArray()


    for (const inactiveUser of inactive) {

        const { lastStatus, name } = inactiveUser

        if (lastStatus > 1500000) {

            const timeStatus = dayjs().format('HH:mm:ss')

            await db.collection("participants").deleteOne({ name })

            const outMessage = {
                from: name,
                to: 'Todos',
                text: 'sai da sala...',
                type: 'status',
                time: timeStatus
            }

            await db.collection("messages").insertOne(outMessage)

        }
    }
}



//setInterval(logOut, 15000);

const server = (5000)
app.listen(server, () => console.log(`Servidor funcionando na porta ${server}`))