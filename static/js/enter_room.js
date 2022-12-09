// map peer usernames to corresponding RTCPeerConnections
// as key value pairs
var mapPeers = {};

// peers that stream own screen
// to remote peers
var mapScreenPeers = {};


const localVideo = document.querySelector('#local-video');
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
// const remoteVideo = document.querySelector('#remote-video');

// local video stream
var localStream = new MediaStream();




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

