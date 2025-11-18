import debug from 'debug'
import app from './app.js'
import PORT  from './config/index.js'
import dbConnect from "./config/dbConnect.js"


const StartServer = async () => {
    app.listen(PORT, () => {
        console.log(`Server Listening on port ${PORT}`)
    }).on('error', (err) => {
        debug(`Error: ${err}`)
        process.exit(1)
    })
}

dbConnect();
StartServer();
