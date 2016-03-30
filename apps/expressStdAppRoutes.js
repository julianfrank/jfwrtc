'use strict'

const helpers = require('../apps/helpers')
const log = helpers.log

let addAppRoutes = (processObjects) => {
    log('expressAppRoutes.js\t:Adding Standard Application Routers')
    return new Promise((resolve, reject) => {

        let app = processObjects.app

        app.all('/loaderio-c9c32ebd352b14740b7dd9d2efee9e2d.html', (req, res) => {// Need this to load test using loader.io
            res.contentType('text/html')
            res.render('loaderio-c9c32ebd352b14740b7dd9d2efee9e2d')
        })

        app.all('/favicon.ico', (req, res) => {// Show my Pretty Face ;) on the favicon area
            res.contentType('image/x-icon')
            res.redirect('/static/favicon.ico')
        })

        app.all('/', (req, res) => {// Main page
            if (!req.session.lastpath) {//[TODO] Remove this when App Session Management is stable
                req.session.lastpath = req.hostname + req.originalUrl + req.path
                log('expressAppRoutes.js\t:No lastpath in session. Setting ' + req.session.lastpath)
            }
            res.contentType('text/html')
            if (req.isAuthenticated()) {
                res.render('secureApp');
            } else {
                res.render('jfmain')
            }
        })

        process.nextTick(() => resolve(processObjects))
    })
}
module.exports = { addAppRoutes }