'use strict';

const roomName = JSON.parse(document.getElementById('room-name').textContent);

var receiveData;
var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
var localStream;
var pc;
var remoteStream;

var pcConfig = {
    'iceServers': [{
      'urls': 'stun:stun.l.google.com:19302'
    },
    {urls: "turn:numb.viagenie.ca",
    credential: "muazkh",
    username: "webrtc@live.com"}]
};


var sdpConstraints = {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true
};


function init() {

    testWebSocket();
}

function testWebSocket() {
    websocket = new WebSocket(
        'ws://'
        + window.location.host
        + '/ws/chat/'
        + roomName
        + '/'
    );
    // websocket.onopen = function(evt) { onOpen(evt) };
    // websocket.onclose = function(evt) { onClose(evt) };
    // websocket.onerror = function(evt) { onError(evt) };
}

var room = 'foo';

// function sendText(message){
//     websocket.send(JSON.stringify({
//         type: "message",
//         text: message
//     }));
    
// }
websocket.onmessage = function(event) {

    // var text = "";

    var msg = JSON.parse(event.data);
  
    switch(msg.type) {
        // case "created":
        //     console.log('Created room ' + msg.room);
        //     isInitiator = true;
        //     break;
        // case "full":
        //     console.log('Room ' + msg.room + ' is full');
        //     break;
        // case "join":
        //     console.log('Another peer made a request to join room ' + msg.room);
        //     console.log('This peer is the initiator of room ' + msg.room + '!');
        //     isChannelReady = true;
        //     break;
        // case "joined":
        //     console.log('joined: ' + msg.room);
        //     isChannelReady = true;
        //     break;
        // case "log":
        //     console.log.apply(console, array);
        //     break;
        case 'message':
            console.log('Client received message:', msg.msg);
            if (msg.msg === 'got user media') {
                maybeStart();
            } else if (msg.msg.type === 'offer') {
                if (!isInitiator && !isStarted) {
                  maybeStart();
                }
                pc.setRemoteDescription(new RTCSessionDescription(msg.msg));
                doAnswer();
            } else if (msg.msg.type === 'answer' && isStarted) {
                pc.setRemoteDescription(new RTCSessionDescription(msg.msg));
            } else if (msg.msg.type === 'candidate' && isStarted) {
                var candidate = new RTCIceCandidate({
                    sdpMLineIndex: msg.msg.label,
                    candidate: msg.msg.candidate
                });
                pc.addIceCandidate(candidate);
            } else if (msg.msg === 'bye' && isStarted) {
                handleRemoteHangup();
            }
            break;
    }
};

window.addEventListener('load', init, false);

// function sendCreateOrJoin(message) {
//     websocket.send(JSON.stringify({
//         type: "create or join",
//         room: message,
//     }));
// }

function sendMessage(message) {
    console.log('Client sending message: ', message);
    websocket.send(JSON.stringify({
        type: 'message',
        msg: message,
    }));
}

// if (roomName !== '') {
//     sendCreateOrJoin(roomName);
//     console.log('Attempted to create or  join room', roomName);
// }

//////////////////////////////////////////////////////////////////////

var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');

navigator.mediaDevices.getUserMedia({
    audio: false,
    video: true
})
.then(gotStream)
.catch(function(e) {
    alert('getUserMedia() error: ' + e.name);
});

function gotStream(stream) {
    console.log('Adding local stream.');
    localStream = stream;
    localVideo.srcObject = stream;
    sendMessage('got user media');
    if (isInitiator) {
      maybeStart();
    }
}

var constraints = {
    video: true
};
  
console.log('Getting user media with constraints', constraints);

if (location.hostname !== 'localhost') {
    requestTurn(
        "stun:stun.l.google.com:19302"
    );
}

function maybeStart() {
    console.log('>>>>>>> maybeStart() ', isStarted, localStream, isChannelReady);
    if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
      console.log('>>>>>> creating peer connection');
      createPeerConnection();
      pc.addStream(localStream);
      isStarted = true;
      console.log('isInitiator', isInitiator);
      if (isInitiator) {
        doCall();
      }
    }
}

window.onbeforeunload = function() {
    sendMessage('bye');
};

///////////////////////////////////////////////////////////////////

function createPeerConnection() {
    try {
      pc = new RTCPeerConnection(pcConfig);
      pc.onicecandidate = handleIceCandidate;
      pc.onaddstream = handleRemoteStreamAdded;
      pc.onremovestream = handleRemoteStreamRemoved;
      console.log('Created RTCPeerConnnection');
    } catch (e) {
      console.log('Failed to create PeerConnection, exception: ' + e.message);
      alert('Cannot create RTCPeerConnection object.');
      return;
    }
}

function handleIceCandidate(event) {
    console.log('icecandidate event: ', event);
    if (event.candidate) {
        sendMessage({
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate
        });
    } else {
        console.log('End of candidates.');
    }
}

function handleCreateOfferError(event) {
    console.log('createOffer() error: ', event);
}

function doCall() {
    console.log('Sending offer to peer');
    pc.createOffer(sdpConstraints).then(
        setLocalAndSendMessage, 
        handleCreateOfferError
    );
}

function doAnswer() {
    console.log('Sending answer to peer.');
    pc.createAnswer(sdpConstraints).then(
        setLocalAndSendMessage,
        onCreateSessionDescriptionError
    );
}

function setLocalAndSendMessage(sessionDescription) {
    pc.setLocalDescription(sessionDescription);
    console.log('setLocalAndSendMessage sending message', sessionDescription);
    sendMessage(sessionDescription);
}

function onCreateSessionDescriptionError(error) {
    trace('Failed to create session description: ' + error.toString());
}

function requestTurn(turnURL) {
    var turnExists = false;
    if (!turnExists) {
    }
}

function handleRemoteStreamAdded(event) {
    console.log('Remote stream added.');
    remoteStream = event.stream;
    remoteVideo.srcObject = remoteStream;
}

function handleRemoteStreamRemoved(event) {
    console.log('Remote stream removed. Event: ', event);
}

function hangup() {
    console.log('Hanging up.');
    stop();
    // sendMessage('bye');
}

function handleRemoteHangup() {
    console.log('Session terminated.');
    stop();
    isInitiator = false;
}
  
function stop() {
    isStarted = false;
    pc.close();
    pc = null;
}

