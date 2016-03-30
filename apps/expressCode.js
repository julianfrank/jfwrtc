'use strict'
const utils = require('util')
const helpers = require('../apps/helpers')
const log = helpers.log

let initExpress = (processObjects) => {
    log('expressCode.js\t:Initializing Express')
    return new Promise((resolve, reject) => {

        const bodyParser = require('body-parser') //Required to read the body

        let app = processObjects.app
        app.locals.name = 'Julian Frank\'s WebRTC Application'

        app.engine('html', helpers.readHTML);// define the template engine [(filePath, options, callback)]
        app.set('views', 'pages'); // specify the views directory
        app.set('view engine', 'html'); // register the template engine
        app.set('trust proxy', true) // trust first proxy
        app.use(processObjects.expressSession({
            store: processObjects.redisSessionStore,
            secret: helpers.hourlyState(),
            saveUninitialized: false,
            resave: false,
            proxy: true,
            cookie: {}
        }))
        app.use(bodyParser.json({ type: 'application/*+json' }));
        app.use(bodyParser.text({ type: 'text/html' }))
        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(bodyParser.raw({ type: '*/*' }))
        app.use('/static', processObjects.express.static('static'));
        app.use((req, res, next) => {//Add CORS Support
            res.header("Access-Control-Allow-Origin", "*")//[TODO] Need to update to include only 'Trusted' domains
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
            next()
        })
        app.all('*', (err, req, res, next) => { if (err) return reject('expressCode.js\t:Fatal Error: Error in Express Route ${err}. Going to exit Process.') })//Default Route to log All Access..Enters only if there is an error
        app.all('*', (req, res, next) => {//Default Route to log All Access
            log('expressCode.js\t:req.path:' + req.path + '\treq.isAuthenticated:' + req.isAuthenticated())
            if (typeof req.session === 'undefined') return reject('expressCode.js\t:Fatal Error: Session Service Failed. Possible Redis Failure. Going to exit Process.')
            return next()
        })

        process.nextTick(() => { return resolve(processObjects) })
    })
}

module.exports = { initExpress }