'use strict'

const helpers = require('../apps/helpers')
const log = helpers.log
const inspect = require('util').inspect

let addUserManager = (processObjects) => {
    log('userManager.js\t:Adding User Management Module')
    return new Promise((resolve, reject) => {

        //processObjects.users = []//tobe removed once this module is ready

        processObjects.userManager = () => {

            let userArray = []//User Array Initialization [TODO]move to cloudREDIS or MONGODB

            processObjects.userManager.addUser = (profile) => { //Add new Profile to userArray
                userArray.push(profile)//[TODO]Try to add device specific info also
                log('userManager.js\t:User ' + profile.email + ' added to userArray. Total Logged in users => ' + userArray.length)
            }

            processObjects.userManager.findUserByEmail = (email, cb) => {//Function used by Passport Deserializer to find email in userArray 
                let target = userArray.filter((value, index, array) => {
                    return (value.email === email)
                })
                log('userManager.js\t:Searching for email ' + email + '. Resultant Array =>' + inspect(target.map((x) => { return x.name })))
                if (target.length === 1) {
                    return cb(null, target[0])
                } else {
                    return cb(null, null)
                }
            }

            processObjects.userManager.removeUser = (email) => { //Add new Profile to userArray
                userArray = userArray.filter((val) => { return (val.email != email) })
                log('userManager.js\t:User ' + email + ' Removed from userArray. Array now is => ' + inspect(userArray.map((x) => { return x.email })))
            }

        }
        processObjects.userManager()

        process.nextTick(() => resolve(processObjects))
    })
}
module.exports = { addUserManager }