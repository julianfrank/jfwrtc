'use strict'
const util = require('util')
const helpers = require('../apps/helpers')
const log = helpers.remoteLog

const redisLabURL = process.env.REDISURL || require('../secrets.js').redisurl
const redisLabPASS = process.env.REDISCREDS || require('../secrets.js').rediscreds

const redisRetryStrategy = (options) => {
    log('warn','redisCode.js\t:Redis Retry being Executed using options-> ' + util.inspect(options),['redisCode'])
    if (options.error.code === 'ECONNREFUSED') { return new Error('The RedisLab server refused the connection'); }// End reconnecting on a specific error and flush all commands with a individual error
    if (options.total_retry_time > 1000 * 60 * 60) { return new Error('RedisLab Retry time exhausted'); }// End reconnecting after a specific timeout and flush all commands with a individual error
    if (options.times_connected > 10) { return undefined; }// End reconnecting with built in error
    return Math.max(options.attempt * 100, 3000);// reconnect after
}

function initRedis(processObjects) {
    log('info','redisCode.js\t:Initializing RedisSessionStore',['redisCode'])
    return new Promise((resolve, reject) => {

        log('verbose','redisCode.js\t:Creating redisClient for Session store',['redisCode'])
        processObjects.redisClient = processObjects.redis.createClient({
            url: 'redis://' + redisLabURL,
            retry_strategy: redisRetryStrategy,
            prefix: 'redis.'
        })
        processObjects.redisClient.auth(redisLabPASS, () => {
            processObjects.redisClient.info((err, reply) => {
                if (err) {
                    reject('redisCode.js\t:Error Returned by Redis Server :' + err)
                } else {
                    log('verbose','redisCode.js\t:redisClient Connected to ' + redisLabURL,['redisCode'])
                    processObjects.redisSessionStore = new processObjects.redisStore({// create new redis store for Session Management 
                        url: 'redis://' + redisLabURL,
                        client: processObjects.redisClient,
                        ttl: 1 * 10 * 60,//TTL in Seconds...Set to 10 minutes
                        prefix: 'redisSessionStore.'
                    })
                    processObjects.redisSessionStore.client.info((err, reply) => {
                        if (err) {
                            reject('redisCode.js\t:Error Returned by Redis Server :' + err)
                        } else {
                            log('verbose','redisCode.js\t:Redis Session Store Created Successfully',['redisCode'])
                            process.nextTick(() => resolve(processObjects))//Ensure we proceed only if Redis is connected and RedisSessionstore is working
                        }
                    })
                }
            })
        })
    })
}

function quitRedis(processObjects) {
    log('info','redisCode.js\t:Quiting Redis',['redisCode'])
    return new Promise((resolve, reject) => {
        processObjects.redisClient.quit((err, res) => {
            if (res === 'OK') {
                log('verbose','redisCode.js\t:Quit Redis Connection: ' + redisLabURL,['redisCode'])
                processObjects.redisSessionStore.client.quit((err, res) => {
                    if (res === 'OK') log('error','redisCode.js\t:Alert! Redis Session Still seems Not Closed. Continuing to End Process Anyway',['redisCode'])
                    resolve(processObjects)
                })
            } else {
                log('error','redisCode.js\t:Error: Redis Connection not Closed. Redis Server Says\tResult:' + res + '\tError:' + err + ' Continuing to End Process Anyway',['redisCode'])
                reject(err)
            }
        })
    })
}

function initUMRedisClient(processObjects) {
    log('info','redisCode.js\t:Initializing Redis User Management Store',['redisCode'])
    return new Promise((resolve, reject) => {

        log('verbose','redisCode.js\t:Creating umRedisClient for User Management store',['redisCode'])

        processObjects.umRedisClient = processObjects.redis.createClient({
            url: 'redis://' + redisLabURL,
            retry_strategy: redisRetryStrategy,
            prefix: 'userMan.'
        })

        processObjects.umRedisClient.on("error", (err) => {
            log('verbose',"redisCode.js\t: umRedisClient creation Error " + err,['redisCode'])
            reject(err)
        })

        processObjects.umRedisClient.auth(redisLabPASS, () => {
            processObjects.umRedisClient.info((err, reply) => {
                if (err) {
                    reject('redisCode.js\t:Error Returned by Redis Server :' + err)
                } else {
                    log('verbose','redisCode.js\t:umRedisClient Connected to ' + redisLabURL,['redisCode'])
                    process.nextTick(() => resolve(processObjects))//Ensure we proceed only if Redis is connected and umRedisClient is working
                }
            })
        })
    })
}

function quitUMRedis(processObjects) {
    log('info','redisCode.js\t:Quiting UMRedisClient',['redisCode'])
    return new Promise((resolve, reject) => {
        processObjects.umRedisClient.quit((err, res) => {
            if (res === 'OK') {
                log('verbose','redisCode.js\t:Quit umRedis Connection: ' + redisLabURL,['redisCode'])
                resolve(processObjects)
            } else {
                log('error','redisCode.js\t:Error: umRedis Connection not Closed. Redis Server Says\tResult:' + res + '\tError:' + err + ' Continuing to End Process Anyway',['redisCode'])
                reject(err)
            }
        })
    })
}

function initSIOPubRedisClient(processObjects) {
    log('info','redisCode.js\t:Initializing Socket.io Redis Publisher Client',['redisCode'])
    return new Promise((resolve, reject) => {

        log('verbose','redisCode.js\t:Creating sioPubRedisClient for SocketIO Services',['redisCode'])

        processObjects.sioPubRedisClient = processObjects.redis.createClient({
            url: 'redis://' + redisLabURL,
            retry_strategy: redisRetryStrategy,
            prefix: 'sioPub.'
        })

        processObjects.sioPubRedisClient.on("error", (err) => {
            log('error',"redisCode.js\t: sioPubRedisClient creation Error " + err,['redisCode'])
            reject(err)
        })

        processObjects.sioPubRedisClient.auth(redisLabPASS, () => {
            processObjects.sioPubRedisClient.info((err, reply) => {
                if (err) {
                    reject('redisCode.js\t:Error Returned by Redis Server :' + err)
                } else {
                    log('verbose','redisCode.js\t:sioPubRedisClient Connected to ' + redisLabURL,['redisCode'])
                    process.nextTick(() => resolve(processObjects))//Ensure we proceed only if Redis is connected and sioPubRedisClient is working
                }
            })
        })
    })
}

function quitSIOPubRedis(processObjects) {
    log('info','redisCode.js\t:Quiting sioPubRedisClient',['redisCode'])
    return new Promise((resolve, reject) => {
        processObjects.sioPubRedisClient.quit((err, res) => {
            if (res === 'OK') {
                log('verbose','redisCode.js\t:Quit sioPubRedisClient Connection: ' + redisLabURL,['redisCode'])
                resolve(processObjects)
            } else {
                log('error','redisCode.js\t:Error: sioPubRedisClient Connection not Closed. Redis Server Says\tResult:' + res + '\tError:' + err + ' Continuing to End Process Anyway',['redisCode'])
                reject(err)
            }
        })
    })
}

function initSIOSubRedisClient(processObjects) {
    log('info','redisCode.js\t:Initializing Socket.io Redis Subscriber Client',['redisCode'])
    return new Promise((resolve, reject) => {

        log('verbose','redisCode.js\t:Creating sioSubRedisClient for SocketIO Services',['redisCode'])

        processObjects.sioSubRedisClient = processObjects.redis.createClient({
            url: 'redis://' + redisLabURL,
            retry_strategy: redisRetryStrategy,
            prefix: 'sioSub.',
            return_buffers: true
        })

        processObjects.sioSubRedisClient.on("error", (err) => {
            log('error',"redisCode.js\t: sioSubRedisClient creation Error " + err,['redisCode'])
            reject(err)
        })

        processObjects.sioSubRedisClient.auth(redisLabPASS, () => {
            processObjects.sioSubRedisClient.info((err, reply) => {
                if (err) {
                    reject('redisCode.js\t:Error Returned by Redis Server :' + err)
                } else {
                    log('verbose','redisCode.js\t:sioSubRedisClient Connected to ' + redisLabURL,['redisCode'])
                    process.nextTick(() => resolve(processObjects))//Ensure we proceed only if Redis is connected and sioPubRedisClient is working
                }
            })
        })
    })
}

function quitSIOSubRedis(processObjects) {
    log('info','redisCode.js\t:Quiting sioSubRedisClient',['redisCode'])
    return new Promise((resolve, reject) => {
        processObjects.sioSubRedisClient.quit((err, res) => {
            if (res === 'OK') {
                log('verbose','redisCode.js\t:Quit sioSubRedisClient Connection: ' + redisLabURL,['redisCode'])
                resolve(processObjects)
            } else {
                log('error','redisCode.js\t:Error: sioSubRedisClient Connection not Closed. Redis Server Says\tResult:' + res + '\tError:' + err + ' Continuing to End Process Anyway',['redisCode'])
                reject(err)
            }
        })
    })
}

module.exports = {
    initRedis, quitRedis,
    initUMRedisClient, quitUMRedis,
    initSIOPubRedisClient, quitSIOPubRedis,
    initSIOSubRedisClient, quitSIOSubRedis
}