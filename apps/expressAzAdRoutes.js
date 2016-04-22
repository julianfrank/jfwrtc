'use strict'

const helpers = require('../apps/helpers')
const log = helpers.remoteLog
const inspect = require('util').inspect

let addAzAdRoutes = (processObjects) => {
    log('info','expressAzAdRoutes.js\t:Adding AzAD Related Routes',['expressAzAdRoutes'])
    return new Promise((resolve, reject) => {

        let app = processObjects.app
        let passport = processObjects.passport
        let userMan = processObjects.userManager

        app.get('/oauth2signin', passport.authenticate('azuread-openidconnect', { failureRedirect: '/oauth2signin', failureFlash: true }),
            (req, res) => {
                log('verbose','expressAzAdRoutes.js\t:Login was called in the Sample',['expressAzAdRoutes'])
                req.session.save((err) => {
                    if (err === null) {
                        log('error','expressAzAdRoutes.js\t:Error while saving session in oauth2signin ' + err,['expressAzAdRoutes'])
                    } else {
                        res.redirect('/')
                    }
                })
            })

        // GET /oauth2return
        //   Use passport.authenticate() as route middleware to authenticate the
        //   request.  If authentication fails, the user will be redirected back to the
        //   login page.  Otherwise, the primary route function function will be called,
        //   which, in this example, will redirect the user to the home page.
        app.get('/oauth2return', passport.authenticate('azuread-openidconnect', { failureRedirect: '/oauth2signin', failureFlash: true }),
            (req, res) => {
                log('verbose','expressAzAdRoutes.js\t:We received a GET return from AzureAD.',['expressAzAdRoutes'])
                //req.session.save((err) => {
                    //if (err === null) log('verbose','expressAzAdRoutes.js\t:Error while saving session GET->oauth2return ' + err,['expressAzAdRoutes']) 
                //})
                res.redirect('/')
            })

        // POST /oauth2return
        //   Use passport.authenticate() as route middleware to authenticate the
        //   request.  If authentication fails, the user will be redirected back to the
        //   login page.  Otherwise, the primary route function function will be called,
        //   which, in this example, will redirect the user to the home page.
        app.post('/oauth2return', passport.authenticate('azuread-openidconnect', { failureRedirect: '/oauth2signin', failureFlash: true }),
            (req, res) => {
                log('verbose','expressAzAdRoutes.js\t:We received a POST return from AzureAD.',['expressAzAdRoutes'])
                //req.session.save((err) => { if (err === null) log('verbose','expressAzAdRoutes.js\t:Error while saving session POST->oauth2return ' + err,['expressAzAdRoutes']) })
                res.redirect('/')
            })

        app.get('/logout', (req, res) => {
            if (typeof req.user != 'undefined') {
                log('verbose','expressAzAdRoutes.js\t:Logout Initiated for user ->' + inspect(req.user.email),['expressAzAdRoutes'])
                userMan.removeUser(req.user.email)
                req.logout()
                let sid = req.session.id
                req.session.destroy((err) => {
                    if (err) {
                        log('error','expressAzAdRoutes.js\t: Session ' + sid + ' Destroy attempted with error-> ' + err,['expressAzAdRoutes'])
                    } else {
                        log('verbose','expressAzAdRoutes.js\t: Session ' + sid + ' Destroyed',['expressAzAdRoutes'])
                    }
                })
            }
            res.redirect('/')
        })

        process.nextTick(() => resolve(processObjects))
    })
}
module.exports = { addAzAdRoutes }