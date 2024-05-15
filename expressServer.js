const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')
// const cors = require('cors')
// const helmet = require('helmet')
const compression = require('compression')
const userRouter = require('./routers/users')
const { router: authRouter, isAuth } = require('./routers/auth')
const settingRouter = require('./routers/settings')
const collectionsModel = require('./models/collections')
const securityQuestionsRouter = require('./routers/securityQuestions')
const flashcardsModel = require('./models/flashcards')
const collectionRouter = require('./routers/collection')
const mongoose = require('mongoose')


const app = express()
const server = require('http').createServer(app)

// const whitelist = ['http://localhost:3000']

// app.use(cors({ credentials: true, origin: whitelist }))
// app.use(helmet())

// const {x, y, generateDaysOfCurrMonth} = require('./public/scripts/calendar.js');

app.use(compression())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(express.static(__dirname + '/public'))
app.set('view engine', 'ejs')

const mongoUrl = process.env.NODE_ENV === 'local' ?
    `mongodb://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/` :
    `mongodb+srv://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}/?retryWrites=true&w=majority&appName=BBY26`

const options = {
    mongoUrl: mongoUrl,
    crypto: {
        secret: process.env.MONGODB_SESSION_SECRET,
    },
    ttl: process.env.SESSION_TTL,
}

app.set('trust proxy', 1)
app.use(session({
    secret: process.env.SECRET,
    store: MongoStore.create(options),
    saveUninitialized: false,
    resave: false,
    cookie: { secure: false },
}))

app.use('/', authRouter)
app.use('/users', isAuth, userRouter)
app.use('/settings', isAuth, settingRouter)
app.use('/securityQuestions', isAuth, securityQuestionsRouter)
app.use('/collection', isAuth, collectionRouter)

app.get('/', isAuth, (req, res) => {
    const days = 3
    return res.render('home', { days: days, name: req.session.name, email: req.session.email })
})

app.get('/health', (_, res) => {
    return res.status(200).send('ok')
})

app.get('/collection', async (req, res) => {
    const collections = await collectionsModel.find({ userId: '6643e18784cc34b06add4f2f' })
    return res.render('collection', { collections: collections })
})

app.post('/searchCollection', async (req, res) => {
    const search = req.body.search
    const regexPattern = new RegExp('^' + search, 'i')
    const collections = await collectionsModel.find({ userId: '6643e18784cc34b06add4f2f', setName: { $regex: regexPattern } })
    return res.render('collection', { collections: collections })
})

app.get('/deleteCollection/:shareid', async (req, res) => {
    const shareId = req.params.shareid
    console.log('Inside delete, shareid: ' + shareId)
    deleteSet(shareId)
    res.redirect('/collection')
})

async function deleteSet(shareID) {
    try {
        await collectionsModel.deleteOne({ shareId: shareID })
        console.log('Document deleted successfully')
    } catch (err) {
        console.error('Error deleting document: ', err)
    }
}

app.get('/test', (req, res) => {
    return res.render('template')
})

app.get('/landing', (req, res) => {
    return res.render('landing')
})

app.get('/generate', (req, res) => {
    return res.render('generate')
})

app.get('/signup', (req, res) => {
    return res.render('signup')
})

app.get('/review/:setid', (req, res) => {
    const cards = [
        {
            question: 'Element symbol for gold',
            answer: 'Au',
        },
        {
            question: 'Element symbol for Iron',
            answer: 'Fe',
        },
        {
            question: 'Element symbol for Nickel',
            answer: 'Ni',
        },
        {
            question: 'Element symbol for Zinc',
            answer: 'Zn',
        },
        {
            question: 'Element symbols for Mercury',
            answer: 'Hg',
        },
    ]
    const carouselData = { bg: '/images/plain-FFFFFF.svg', cards: cards, id: req.params.setid, queryType: 'view' }

    return res.render('review', carouselData)
})

app.get('/check/:json', (req, res) => {
    data = [
        {
            'question': 'What is the capital of France?',
            'answer': 'Paris',
        },
        {
            'question': 'Who wrote \'Romeo and Juliet\'?',
            'answer': 'William Shakespeare',
        },
        {
            'question': 'What is the powerhouse of the cell?',
            'answer': 'Mitochondria',
        },
        {
            'question': 'What is the chemical symbol for water?',
            'answer': 'H2O',
        },
        {
            'question': 'What year did the Titanic sink?',
            'answer': '1912',
        },
    ]

    const carouselData = { bg: '/images/plain-FFFFFF.svg', cards: data, queryType: 'finalize' }

    return res.render('review', carouselData)
})

app.post('/submitcards', async (req, res) => {
    let lastShareCode
    let shareId

    // get the latest sharecode from collections
    try {
        const result = await collectionsModel.findOne().sort({ shareId: -1 }).select('shareId').exec()
        console.log('result:' + result)
        lastShareCode = result ? result.shareId : null
    } catch (err) {
        console.log('Failed to fetch latestShareCode')
    }

    if (lastShareCode === null) {
        shareId = 0
    } else {
        shareId = lastShareCode + 1
    }

    const inputData = JSON.parse(req.body.cards).map((card) => {
        return {
            shareId: `${shareId}`,
            ...card,
        }
    })

    const transactionSession = await mongoose.startSession()
    transactionSession.startTransaction()
    try {
        await flashcardsModel.insertMany(inputData)
        await collectionsModel.create({ setName: `${req.body.name}`, userId: req.session._id, shareId: shareId })
        await transactionSession.commitTransaction()
        transactionSession.endSession()
        console.log(`Successfully wrote ${req.body.name} to db`)
    } catch (err) {
        await transactionSession.abortTransaction()
        transactionSession.endSession()
        console.log('Error inserting db')
    }

    res.status(200)
    res.json(JSON.stringify({ shareId: shareId }))
})

app.get('*', (req, res) => {
    return res.status(404).json({ msg: 'page not found' })
})

app.use((err, req, res, next) => {
    console.error(err)
    return res.status(err.code || 500).json({ msg: err })
})

module.exports = { server, app, mongoUrl }
