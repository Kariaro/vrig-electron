import React from 'react';
import ProgressBar from 'react-bootstrap/ProgressBar';
import RenderView from './comp/RenderView';
import './App.css';

import * as Kalidokit from 'kalidokit';
import { Face, Pose, Hand } from 'kalidokit';

/*
let currentVrm;

// renderer
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// camera
const orbitCamera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
orbitCamera.position.set(0.0, 1.4, 0.7);

// controls
const orbitControls = new THREE.OrbitControls(orbitCamera, renderer.domElement);
orbitControls.screenSpacePanning = true;
orbitControls.target.set(0.0, 1.4, 0.0);
orbitControls.update();

// scene
const scene = new THREE.Scene();

// light
const light = new THREE.DirectionalLight(0xffffff);
light.position.set(1.0, 1.0, 1.0).normalize();
scene.add(light);

// Main Render Loop
const clock = new THREE.Clock();

function animate() {
	requestAnimationFrame(animate);

	if (currentVrm) {
		// Update model to render physics
		currentVrm.update(clock.getDelta());
	}

	renderer.render(scene, orbitCamera);
}
animate();

// Import Character VRM
const loader = new THREE.GLTFLoader();
loader.crossOrigin = "anonymous";

// Import model from URL, add your own model here
loader.load(
	"https://cdn.glitch.com/29e07830-2317-4b15-a044-135e73c7f840%2FAshtra.vrm?v=1630342336981",

	gltf => {
		THREE.VRMUtils.removeUnnecessaryJoints(gltf.scene);
		THREE.VRM.from(gltf).then(vrm => {
			scene.add(vrm.scene);
			console.log('LOADED');
			currentVrm = vrm;
			currentVrm.scene.rotation.y = Math.PI; // Rotate model 180deg to face camera
		});
	},

	progress => console.log("Loading model...", 100.0 * (progress.loaded / progress.total), "%"),
	error => console.error(error)
);
*/

function App() {
    return (
        <div className="App">
			<div>
				<ProgressBar now={40} />
			</div>

			<RenderView />
        </div>
    );
}

export default App;
