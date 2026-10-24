import express, {type Request, type Response} from 'express'
import 'dotenv/config'

const app = express()
const PORT = process.env.PORT ?? 4000

app.use(express.json())

app.get('/', (req: Request, res: Response) => {
    console.log("Hello")
    return res.json({message: "Success"})
})

app.listen(PORT, () => console.log("Server is running"))