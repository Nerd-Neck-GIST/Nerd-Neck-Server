// map peer usernames to corresponding RTCPeerConnections
// as key value pairs
var mapPeers = {};

// peers that stream own screen
// to remote peers
var mapScreenPeers = {};


const localVideo = document.querySelector('#local-video');
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
const remoteVideo = document.querySelector('#remote-video');

// local video stream
var localStream = new MediaStream();


// ul of messages
var ul = document.querySelector("#message-list");

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

var loc = window.location;

var endPoint = '';
var wsStart = 'ws://';

if(loc.protocol == 'https:'){
    wsStart = 'wss://';
}

var endPoint = wsStart + loc.host + loc.pathname;
console.log('endpoint: ', endPoint);
var webSocket;

var start = document.querySelector('#start');

webSocket = new WebSocket(endPoint);

webSocket.addEventListener('open', function(e){
    console.log('Connection opened! ', e);

    // notify other peers
    sendSignal('new-peer', {
        // 'local_screen_sharing': false,
    });
});

webSocket.addEventListener('message', webSocketOnMessage);

webSocket.addEventListener('close', function(e){
    console.log('Connection closed! ', e);
});

webSocket.addEventListener('error', function(e){
    console.log('Error occured! ', e);
});

function webSocketOnMessage(event){
    var parsedData = JSON.parse(event.data);

    var action = parsedData['action'];
    // username of other peer
    var peerUsername = parsedData['peer'];
    
    console.log('peerUsername: ', peerUsername);
    console.log('action: ', action);

    if(peerUsername == username){
        // ignore all messages from oneself
        return;
    }

    // boolean value specified by other peer
    // indicates whether the other peer is sharing screen
    var remoteScreenSharing = parsedData['message']['local_screen_sharing'];
    console.log('remoteScreenSharing: ', remoteScreenSharing);
    
    // channel name of the sender of this message
    // used to send messages back to that sender
    // hence, receiver_channel_name
    var receiver_channel_name = parsedData['message']['receiver_channel_name'];
    console.log('receiver_channel_name: ', receiver_channel_name);

    // in case of new peer
    if(action == 'new-peer'){
        console.log('New peer: ', peerUsername);

        // create new RTCPeerConnection
        createOfferer(peerUsername, receiver_channel_name);
        
        return;
    }

    // remote_screen_sharing from the remote peer
    // will be local screen sharing info for this peer
    var localScreenSharing = parsedData['message']['remote_screen_sharing'];

    if(action == 'new-offer'){
        console.log('Got new offer from ', peerUsername);

        // create new RTCPeerConnection
        // set offer as remote description
        var offer = parsedData['message']['sdp'];
        console.log('Offer: ', offer);
        var peer = createAnswerer(offer, peerUsername, receiver_channel_name);

        return;
    }
    

    if(action == 'new-answer'){
        // in case of answer to previous offer
        // get the corresponding RTCPeerConnection
        var peer = null;
        
        
        peer = mapPeers[peerUsername][0];
      

        // get the answer
        var answer = parsedData['message']['sdp'];
        
        console.log('mapPeers:');
        for(key in mapPeers){
            console.log(key, ': ', mapPeers[key]);
        }

        console.log('peer: ', peer);
        console.log('answer: ', answer);

        // set remote description of the RTCPeerConnection
        peer.setRemoteDescription(answer);

        return;
    }
}

const constraints = {
    'video': true,
    'audio': true
}

navigator.mediaDevices.getUserMedia(constraints)
.then(stream => {
    localStream = stream;
    console.log('Got MediaStream:', stream);
    var mediaTracks = stream.getTracks();
    
    for(i=0; i < mediaTracks.length; i++){
        console.log(mediaTracks[i]);
    }
    
    localVideo.srcObject = localStream;
    localVideo.muted = true;
    
    window.stream = stream; // make variable available to browser console

    // audioTracks = stream.getAudioTracks();
    videoTracks = stream.getVideoTracks();

    // unmute audio and video by default
    // audioTracks[0].enabled = true;
    videoTracks[0].enabled = true;

})
.catch(error => {
    console.error('Error accessing media devices.', error);
});

//then 안쪽이 function(model){} 이렇게 쓰는거랑 같다 (인자가 하나라 중괄호가 없는 것)
posenet.load().then((model) => {
    
    // 이곳의 model과 아래 predict의 model은 같아야 한다.
    localVideo.addEventListener('loadeddata', (e) => {
        //비디오가 load된 다음에 predict하도록. (안하면 콘솔에 에러뜸)
        predict();
       
        
    });
    let total_angle=0;
    let avg_angle=0;
    let cnt=0;
    let keypoints;

    function predict() {
        //frame이 들어올 때마다 estimate를 해야하니 함수화 시킴
        
        model.estimateSinglePose(localVideo).then((pose) => {
            canvas.width = localVideo.width; //캔버스와 비디오의 크기를 일치시킴
            canvas.height = localVideo.height;
        
            drawKeypoints(pose.keypoints, 0.6, context); //정확도 
            drawSkeleton(pose.keypoints, 0.6, context);
            keypoints = pose.keypoints
            
        });
        
        requestAnimationFrame(predict); //frame이 들어올 때마다 재귀호출
        
    }
    
    setInterval(function(){
        angle = findAngle(keypoints);
        if (angle != -1){
            console.log("angle: %d", angle);
            total_angle = total_angle + angle;
            cnt++;
        }
        else{
            console.log("not detected")
        }
    }, 1000)

    setInterval(function(){
        avg_angle=total_angle/cnt
        console.log("avg_angle: %d", avg_angle);
        if(avg_angle > 30){
            console.log(avg_angle);
            modalOn();
            setTimeout(function(){
                modalOff()
            }, 2000);
        }
        avg_angle=0;
        total_angle=0;
        cnt=0;
    }, 5000);
});

/* PoseNet을 쓰면서 사용하는 함수들 코드 - 그냥 복사해서 쓰기*/

//tensorflow에서 제공하는 js 파트
const color = "aqua";
const boundingBoxColor = "red";
const lineWidth = 2;

function toTuple({y, x}) {
    return [y, x];
}

function drawPoint(ctx, y, x, r, color) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    
}

function drawSegment([ay, ax], [by, bx], color, scale, ctx) {
    ctx.beginPath();
    ctx.moveTo(ax * scale, ay * scale);
    ctx.lineTo(bx * scale, by * scale);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.stroke();
}

function drawSkeleton(keypoints, minConfidence, ctx, scale = 1) {
    const adjacentKeyPoints = posenet.getAdjacentKeyPoints(keypoints, minConfidence);

    adjacentKeyPoints.forEach((keypoints) => {
        drawSegment(toTuple(keypoints[0].position), toTuple(keypoints[1].position), color, scale, ctx);
    });
}

function drawKeypoints(keypoints, minConfidence, ctx, scale = 1) {
    
    for (let i = 0; i < keypoints.length; i++) {
        const keypoint = keypoints[i];

        if (keypoint.score < minConfidence) {
            continue;
        }

        const {y, x} = keypoint.position;
        drawPoint(ctx, y * scale, x * scale, 3, color);
        
    }
}

function drawBoundingBox(keypoints, ctx) {
    const boundingBox = posenet.getBoundingBox(keypoints);
    ctx.rect(
        boundingBox.minX,
        boundingBox.minY,
        boundingBox.maxX - boundingBox.minX,
        boundingBox.maxY - boundingBox.minY
    );
    ctx.strokeStyle = boundingBoxColor;
    ctx.stroke();
}

function findAngle(keypoints){
    let angle;
    let leftEar = keypoints[3]
    let rightEar = keypoints[4]
    let leftShoulder = keypoints[5]
    let rightShoulder = keypoints[6]
    let threshold = 0.9
    if(leftEar.score >= threshold && leftShoulder.score >= threshold && rightShoulder.score >= threshold && rightEar.score >= threshold){
        posEarY = (leftEar.position.y + rightEar.position.y)/2
        posEarX = (leftEar.position.x + rightEar.position.x)/2
        posShoulderY = (leftShoulder.position.y + rightShoulder.position.y)/2
        posShoulderX = (leftShoulder.position.x + rightShoulder.position.x)/2
        angle = 90 - Math.atan(Math.abs(posEarY - posShoulderY)/Math.abs(posEarX - posShoulderX))*180/Math.PI;
    } 
    // When User come to left
    else if (leftEar.score >= threshold && leftShoulder.score >= threshold){
        console.log("left");
        angle = 90 - Math.atan(Math.abs(leftEar.position.y - leftShoulder.position.y)/Math.abs(leftEar.position.x - leftShoulder.position.x))*180/Math.PI;
    }
    // When User come to right
    else if (rightEar.score >= threshold && rightShoulder.score >= threshold){
        console.log("right");
        angle = 90 - Math.atan(Math.abs(rightEar.position.y - rightShoulder.position.y)/Math.abs(rightEar.position.x - rightShoulder.position.x))*180/Math.PI;
    }
    else{
        return -1;
    }
    return angle;
}

// send the given action and message
// over the websocket connection
function sendSignal(action, message){
    webSocket.send(
        JSON.stringify(
            {
                'peer': username,
                'action': action,
                'message': message,
            }
        )
    )
}

// create RTCPeerConnection as offerer
// and store it and its datachannel
// send sdp to remote peer after gathering is complete
function createOfferer(peerUsername, receiver_channel_name){
    var peer = new RTCPeerConnection(pcConfig);

    // add local user media stream tracks
    addLocalTracks(peer);
    
    // create and manage an RTCDataChannel
    var dc = peer.createDataChannel("channel");
    dc.addEventListener('open', () => {
        console.log("Connection opened.");
    });
    dc.addEventListener('message', dcOnMessage);

    // var remoteVideo = createVideo(peerUsername);
    setOnTrack(peer, remoteVideo);

    mapPeers[peerUsername] = [peer, dc];

    peer.addEventListener('iceconnectionstatechange', () => {
        var iceConnectionState = peer.iceConnectionState;
        if (iceConnectionState === "failed" || iceConnectionState === "disconnected" || iceConnectionState === "closed"){
            delete mapPeers[peerUsername];
            if(iceConnectionState != 'closed'){
                peer.close();
            }

            removeVideo(remoteVideo);
        }
    });
    

    peer.addEventListener('icecandidate', (event) => {
        if(event.candidate){
            console.log("New Ice Candidate! Reprinting SDP" + JSON.stringify(peer.localDescription));
            return;
        }
        
        // event.candidate == null indicates that gathering is complete
        
        console.log('Gathering finished! Sending offer SDP to ', peerUsername, '.');
        console.log('receiverChannelName: ', receiver_channel_name);

        // send offer to new peer
        // after ice candidate gathering is complete
        sendSignal('new-offer', {
            'sdp': peer.localDescription,
            'receiver_channel_name': receiver_channel_name,
        });
    });

    peer.createOffer(sdpConstraints)
        .then(o => peer.setLocalDescription(o))
        .then(function(event){
            console.log("Local Description Set successfully.");
        });

    console.log('mapPeers[', peerUsername, ']: ', mapPeers[peerUsername]);

    return peer;
}

// create RTCPeerConnection as answerer
// and store it and its datachannel
// send sdp to remote peer after gathering is complete
function createAnswerer(offer, peerUsername, receiver_channel_name){
    var peer = new RTCPeerConnection(pcConfig);

    addLocalTracks(peer);

    // if(!localScreenSharing && !remoteScreenSharing){
        // if none are sharing screens (normal operation)

        // set remote video
        // var remoteVideo = createVideo(peerUsername);

        // and add tracks to remote video
    setOnTrack(peer, remoteVideo);

    // it will have an RTCDataChannel
    peer.addEventListener('datachannel', e => {
        console.log('e.channel.label: ', e.channel.label);
        peer.dc = e.channel;
        peer.dc.onmessage = dcOnMessage;
        peer.dc.onopen = () => {
            console.log("Connection opened.");
        }

        // store the RTCPeerConnection
        // and the corresponding RTCDataChannel
        // after the RTCDataChannel is ready
        // otherwise, peer.dc may be undefined
        // as peer.ondatachannel would not be called yet
        mapPeers[peerUsername] = [peer, peer.dc];
    });

    peer.addEventListener('iceconnectionstatechange', () => {
        var iceConnectionState = peer.iceConnectionState;
        if (iceConnectionState === "failed" || iceConnectionState === "disconnected" || iceConnectionState === "closed"){
            delete mapPeers[peerUsername];
            if(iceConnectionState != 'closed'){
                peer.close();
            }
            removeVideo(remoteVideo);
        }
    });

    peer.addEventListener('icecandidate', (event) => {
        if(event.candidate){
            console.log("New Ice Candidate! Reprinting SDP" + JSON.stringify(peer.localDescription));
            return;
        }
        
        // event.candidate == null indicates that gathering is complete

        console.log('Gathering finished! Sending answer SDP to ', peerUsername, '.');
        console.log('receiverChannelName: ', receiver_channel_name);

        // send answer to offering peer
        // after ice candidate gathering is complete
        // answer needs to send two types of screen sharing data
        // local and remote so that offerer can understand
        // to which RTCPeerConnection this answer belongs
        sendSignal('new-answer', {
            'sdp': peer.localDescription,
            'receiver_channel_name': receiver_channel_name,
        });
    });

    peer.setRemoteDescription(offer)
        .then(() => {
            console.log('Set offer from %s.', peerUsername);
            return peer.createAnswer(sdpConstraints);
        })
        .then(a => {
            console.log('Setting local answer for %s.', peerUsername);
            return peer.setLocalDescription(a);
        })
        .catch(error => {
            console.log('Error creating answer for %s.', peerUsername);
            console.log(error);
        });

    return peer
}

function dcOnMessage(event){
    var message = event.data;
    
    var li = document.createElement("li");
    li.appendChild(document.createTextNode(message));
    ul.appendChild(li);
}

// get all stored data channels
function getDataChannels(){
    var dataChannels = [];
    
    for(peerUsername in mapPeers){
        console.log('mapPeers[', peerUsername, ']: ', mapPeers[peerUsername]);
        var dataChannel = mapPeers[peerUsername][1];
        console.log('dataChannel: ', dataChannel);

        dataChannels.push(dataChannel);
    }

    return dataChannels;
}

// get all stored RTCPeerConnections
// peerStorageObj is an object (either mapPeers or mapScreenPeers)
function getPeers(peerStorageObj){
    var peers = [];
    
    for(peerUsername in peerStorageObj){
        var peer = peerStorageObj[peerUsername][0];
        console.log('peer: ', peer);

        peers.push(peer);
    }

    return peers;
}

// for every new peer
// create a new video element
// and its corresponding user gesture button
// assign ids corresponding to the username of the remote peer
function createVideo(peerUsername){
    var videoContainer = document.querySelector('#video-container');
    
    // create the new video element
    // and corresponding user gesture button
    var remoteVideo = document.createElement('video');
    // var btnPlayRemoteVideo = document.createElement('button');

    remoteVideo.id = peerUsername + '-video';
    remoteVideo.autoplay = true;
    remoteVideo.playsinline = true;
    // btnPlayRemoteVideo.id = peerUsername + '-btn-play-remote-video';
    // btnPlayRemoteVideo.innerHTML = 'Click here if remote video does not play';

    // wrapper for the video and button elements
    var videoWrapper = document.createElement('div');

    // add the wrapper to the video container
    videoContainer.appendChild(videoWrapper);

    // add the video to the wrapper
    videoWrapper.appendChild(remoteVideo);
   

    return remoteVideo;
}

// set onTrack for RTCPeerConnection
// to add remote tracks to remote stream
// to show video through corresponding remote video element
function setOnTrack(peer, remoteVideo){
    console.log('Setting ontrack:');
    // create new MediaStream for remote tracks
    var remoteStream = new MediaStream();

    // assign remoteStream as the source for remoteVideo
    remoteVideo.srcObject = remoteStream;

    console.log('remoteVideo: ', remoteVideo.id);

    peer.addEventListener('track', async (event) => {
        console.log('Adding track: ', event.track);
        remoteStream.addTrack(event.track, remoteStream);
    });
}

// called to add appropriate tracks
// to peer
function addLocalTracks(peer){
    // if(!localScreenSharing){
        // if it is not a screen sharing peer
        // add user media tracks
        localStream.getTracks().forEach(track => {
            console.log('Adding localStream tracks.');
            peer.addTrack(track, localStream);
        });

        return;
}

function removeVideo(video){
    // get the video wrapper
    var videoWrapper = video.parentNode;
    // remove it
    videoWrapper.parentNode.removeChild(videoWrapper);
}

