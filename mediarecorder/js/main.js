'use strict';

/* globals MediaRecorder */

// This code is shamelessly stolen/adapted from
// https://rawgit.com/Miguelao/demos/master/mediarecorder.html

var mediaSource = new MediaSource();
mediaSource.addEventListener('sourceopen', handleSourceOpen, false);
var mediaRecorder;
var recordedBlobs = [];
var sourceBuffer;

navigator.getUserMedia = navigator.getUserMedia ||
navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

var constraints = {
  audio: false,
  video: true
};

var gumVideo = document.querySelector('video#gum');
var recordedVideo = document.querySelector('video#recorded');
// recordedVideo.src = URL.createObjectURL(mediaSource);

var recordButton = document.querySelector('button#record');
var playButton = document.querySelector('button#play');
var downloadButton = document.querySelector('button#download');
recordButton.onclick = toggleRecording;
playButton.onclick = play;
downloadButton.onclick = download;

// window.isSecureContext not available in Firefox
var isSecureOrigin = location.protocol === 'https:' ||
location.host === 'localhost';
if (!isSecureOrigin) {
  alert('getUserMedia() must be run from a secure origin: HTTPS or localhost.' +
    '\n\nChanging protocol to HTTPS');
  location.protocol = 'HTTPS';
}
navigator.getUserMedia(constraints, handleGumSuccess, handleGumError);

function handleSourceOpen(event) {
  console.log('MediaSource opened');
  sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
  console.log('Source buffer: ', sourceBuffer);
}

function handleGumSuccess(stream) {
  console.log('getUserMedia() got stream: ', stream);
  window.stream = stream; // make available to browser console
  if (window.URL) {
    gumVideo.src = window.URL.createObjectURL(stream);
  } else {
    gumVideo.src = stream;
  }
}

function handleGumError(error) {
  console.log('navigator.getUserMedia error: ', error);
}

function handleDataAvailable(event) {
  if (event.data.size > 0) {
    recordedBlobs.push(event.data);
    console.assert(mediaRecorder.state === 'recording',
      'State should be "recording"');
  } else {
    console.assert(mediaRecorder.state === 'inactive',
      'State should be "inactive"');
  }
}

function handleStop(event) {
  console.log('Recorder stopped: ', event);
}

function toggleRecording() {
  if (recordButton.textContent === 'Start Recording') {
    startRecording();
  } else {
    stopRecording();
    recordButton.textContent = 'Start Recording';
    playButton.disabled = false;
    downloadButton.disabled = false;
  }
}

function startRecording() {
  try {
    mediaRecorder = new MediaRecorder(window.stream, 'video/vp8');
  } catch (event) {
    alert('MediaRecorder is not supported by this browser.\n\n' +
      'Try Chrome 47 or later, with Enable experimental Web Platform features enabled from chrome://flags.');
    console.error('Exception while creating MediaRecorder:', event);
    return;
  }
  console.assert(mediaRecorder.state === 'inactive');
  recordButton.textContent = 'Stop Recording';
  playButton.disabled = true;
  downloadButton.disabled = true;
  mediaRecorder.onstop = handleStop;
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start();
  console.log('MediaRecorder started', mediaRecorder);
  console.assert(mediaRecorder.state === 'recording');
}

function stopRecording() {
  mediaRecorder.stop();
  console.log('Recorded Blobs: ', recordedBlobs);
  // window.stream.getVideoTracks()[0].stop();
}

function play() {
  // sourceBuffer.appendBuffer(recordedBlobs); // or...
  var superBuffer = new Blob(recordedBlobs);
  recordedVideo.src = window.URL.createObjectURL(superBuffer);
  recordedVideo.controls = true;
}

function download() {
  var blob = new Blob(recordedBlobs, {type: 'video/webm'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  document.body.appendChild(a);
  a.style = 'display: none';
  a.href = url;
  a.download = 'test.webm';
  a.click();
  window.URL.revokeObjectURL(url);
}