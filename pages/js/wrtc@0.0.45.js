'use strict'

var peerConnectionConfig = {
    //    rtcpMuxPolicy: 'negotiate',
    //    bundlePolicy: 'max-compat',
    //    RTCIceTransportPolicy: 'all',
    iceServers: [
        { urls: 'stun:stun.services.mozilla.com' },
        { urls: 'stun:stun.l.google.com:19302' }
    ]
}
var gumConstraints = { video: true, audio: true }
var pcOptions = {
    optional: [
        { DtlsSrtpKeyAgreement: true },
        { RtpDataChannels: true }
    ]
}
var dcOptions = {
    reliable: true,
    ordered: false
}

var debugSTR = 'Nothing to debug'

var pcLocal, pcRemote, dcLocal, dcRemote, readychannel

switch (detectBrowser().browser) {
    case 'chrome':
        console.info('Chrome Browser Detected')
        var RTCPeerConnection = window.webkitRTCPeerConnection
        var sdpConstraints = { mandatory: { 'OfferToReceiveAudio': false, 'OfferToReceiveVideo': false } }
        break

    case 'firefox':
        console.info('FireFox Browser Detected')
        var RTCPeerConnection = window.RTCPeerConnection
        var sdpConstraints = { mandatory: { 'offerToReceiveAudio': false, 'offerToReceiveVideo': false } }
        break

    default:
        alert('Unsupported Browser -> ' + JSON.stringify(detectBrowser()))
        break
}

function start(isCaller, signal) {
    iAmCaller = isCaller
    console.info('start called \tisCaller->', iAmCaller)

    switch (isCaller) {
        case true:
            //Initialize PeerConnection
            pcLocal = new RTCPeerConnection(peerConnectionConfig, pcOptions)
            console.info('pcLocal Initialized')
            pcLocal.name = 'pcLocal'
            pcLocal.onsignalingstatechange = showPCStateChange
            pcLocal.oniceconnectionstatechange = showPCStateChange
            //pcLocal.onicecandidate = handleIceCandidate //Moved to pcLocal.addIceCandixxx
            pcLocal.onnegotiationneeded = handleNegNeeded
            pcLocal.ondatachannel = handleDataChannel

            //Creating Data Channel 'Before creating Offer'
            dcLocal = pcLocal.createDataChannel('JFwrtc', dcOptions)
            console.info('dcLocal Initialised')
            dcLocal.name = 'dcLocal'
            dcLocal.onerror = errorHandler
            break

        case false:
            //Initialize PeerConnection
            pcRemote = new RTCPeerConnection(peerConnectionConfig, pcOptions)
            console.info('pcRemote Initialized')
            pcRemote.name = 'pcRemote'
            pcRemote.onsignalingstatechange = showPCStateChange
            pcRemote.oniceconnectionstatechange = showPCStateChange
            //pcRemote.onicecandidate = handleIceCandidate//Moved to trigger after pcRemote.setRemotexxx 
            pcRemote.onnegotiationneeded = handleNegNeeded
            pcRemote.ondatachannel = handleDataChannel

            //Not needed according to https://hacks.mozilla.org/2013/07/webrtc-and-the-early-api/
            //Creating Data Channel
            dcRemote = pcRemote.createDataChannel('JFwrtc', dcOptions)
            console.info('dcRemote Initialised')
            dcRemote.name = 'dcRemote'
            dcRemote.onerror = errorHandler

            pcRemote.setRemoteDescription(new RTCSessionDescription(signal))
            pcRemote.createAnswer(gotRemoteDesc, errorHandler, sdpConstraints)

            break

        default:
            console.error('Start Called with invalid isCaller ->', isCaller)
            break
    }
}

//Show Signalling state
function showPCStateChange(event) {
    let thisPC = event.currentTarget
    console.info('PC Changed -> ', thisPC.name, '\tChangeType->', event.type,
        '\niceConnectionState->', thisPC.iceConnectionState, '\ticeGatheringState->', thisPC.iceGatheringState,
        '\nsignalingState->', thisPC.signalingState)

    if (thisPC.iceConnectionState === 'connected') {
        if (thisPC.name === 'pcLocal') {
            console.info(thisPC.name, '->Connected & dcLocal.readyState->', dcLocal.readyState)
        }
    }
}

function handleNegNeeded(event) {
    switch (event.currentTarget.name) {
        case 'pcLocal':
            console.info('handleNegNeeded->pcLocal')
            //Create Offer to Remote
            console.info('Creating Offer in pcLocal')
            pcLocal.createOffer(gotLocalDesc, errorHandler, sdpConstraints)
            break

        case 'pcRemote':
            console.info('handleNegNeeded->pcRemote')
            pcRemote.onicecandidate = handleIceCandidate
            break

        default:
            console.debug('Unknown Target in handleNegNeeded ->', event)
            break
    }
}

function handleIceCandidate(event) {
    if (event.candidate) {
        switch (event.currentTarget.name) {

            case 'pcLocal':
                console.info('handleIceCandidate -> ', event.candidate.sdpMid, ' for ' + event.currentTarget.name)
                signallingChannel.send(event.candidate)
                pcLocal.addIceCandidate(new RTCIceCandidate(event.candidate)).catch(errorHandler)
                break

            case 'pcRemote':
                pcRemote.addIceCandidate(new RTCIceCandidate(event.candidate))
                    .then((x) => {
                        debugSTR = event
                        console.info('handleIceCandidate -> ', event.candidate.sdpMid, ' for ' + event.target.name)
                    })
                    .catch(errorHandler)
                signallingChannel.send(event.candidate)
                break

            default:
                console.debug('Unhandled handleIceCandidate ->', event)
                break
        }
    } else {
        console.info('ICE Candidates Exhausted')
        if (readychannel.readyState === 'open') readychannel.send(readychannel.name + ' is Ready')
    }
}

function setDCHandlers() {
    readychannel.onmessage = handleDCMessage
    readychannel.onopen = handleDCStateChange
    readychannel.onclose = handleDCStateChange
}

function handleDataChannel(event) {
    readychannel = event.channel
    readychannel.name = iAmCaller ? dcLocal.name : dcRemote.name
    console.info(readychannel.name, ' with label ', readychannel.label, ' is Ready')
    setDCHandlers()
}

function handleDCStateChange(event) {
    readychannel = iAmCaller ? dcLocal : dcRemote
    setDCHandlers()
    console.info('handleDCStateChange -> ', readychannel.label, ' State is now ->', readychannel.readyState)
}

function handleDCMessage(event) {
    console.info('handleDCMessage -> ', event.data)
}
function gotLocalDesc(desc) {
    console.info('gotLocalDesc', desc.type)
    pcLocal.setLocalDescription(new RTCSessionDescription(desc), () => {
        signallingChannel.send(desc)
    }, errorHandler)

}

function gotRemoteDesc(desc) {
    console.info('gotRemoteDesc', desc.type)
    pcRemote.setLocalDescription(new RTCSessionDescription(desc), () => {
        signallingChannel.send(desc)
    }, errorHandler)
}

function errorHandler(err) {
    console.error('Error-> ', err)
}

function pageReady() {
    //Handle all SocketIO Messages here
    signallingChannel.signalHandler = (msg) => {
        let signal = msg.message
        setTarget(msg.from)
        switch (signal.type) {

            case 'offer':
                console.info('Offer Received')
                start(false, signal)
                break

            case 'answer':
                console.info('Answer Received')
                pcLocal.setRemoteDescription(new RTCSessionDescription(signal))
                break

            default:
                if (signal.candidate) {
                    if (iAmCaller) {
                        console.info('I Am Caller & Got ICE from Signal')
                        pcLocal.addIceCandidate(new RTCIceCandidate(signal)).catch(errorHandler)
                        pcLocal.onicecandidate = handleIceCandidate
                    } else {
                        console.info('I Am Receiver & Got ICE from Signal')
                        pcRemote.addIceCandidate(new RTCIceCandidate(signal)).catch(errorHandler)
                    }

                } else {
                    console.debug('Unhandled Signal Received-> ', signal, '\nType-> ', typeof signal)
                }
                break
        }
    }
}

// Set up an event listener which will run the startup
// function once the page is done loading.
window.addEventListener('load', pageReady, false)