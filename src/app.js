import express, { json } from "express"
import cors from "cors"

const app = express()

app.use(cors())
app.use(express.json())

const participantes = []
const mensagens = []

app.post('/participants', (req, res) => {

    const { name } = req.body

    if (name === "") {
        return res.sendStatus(422)
    } else if (participantes.find(n => n.name === name)) {
        return res.sendStatus(409)
    }

    participantes.push({ name })

    res.sendStatus(201)

})

app.get('/participants', (req, res) => {

    if (participantes.length === 0) {
        return []
    }
    console.log(participantes)
    res.send(participantes)
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