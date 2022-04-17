import React, { Suspense, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import ProgressBar from 'react-bootstrap/ProgressBar';
import { Html, useProgress } from '@react-three/drei';
import { useVRM } from './../util/VRMLoader';
import { VRMSchema } from '@pixiv/three-vrm';

import VRMModel from './VRMModel';
import VRMButton from './VRMButton';
import './VRMStyle.css';

import * as Kalidokit from 'kalidokit';

import { Vector3, Quaternion, Euler } from 'three';

let currentVrm;

const CameraController = () => {
	const { camera, gl } = useThree();
	useEffect(() => {
		const controls = new OrbitControls(camera, gl.domElement);
		controls.screenSpacePanning = true;
		controls.target.set(0.0, 1.4, 0.0);
		controls.minDistance = 3;
		controls.maxDistance = 20;
		controls.update();
		return () => {
			controls.dispose();
		};
	}, [camera, gl]);
	return null;
};

function Loader() {
	const { progress } = useProgress()
	return <Html center>{progress} % loaded</Html>
}

// Animate Rotation Helper function
const rigRotation = (name, rotation = { x: 0, y: 0, z: 0 }, dampener = 1, lerpAmount = 0.3 ) => {
	if (!currentVrm) {
		return;
	}

	const Part = currentVrm.humanoid.getBoneNode(
		VRMSchema.HumanoidBoneName[name]
	);

	if (!Part) {
		return;
	}

	let euler = new Euler(
		rotation.x * dampener,
		rotation.y * dampener,
		rotation.z * dampener
	);

	let quaternion = new Quaternion().setFromEuler(euler);
	Part.quaternion.slerp(quaternion, lerpAmount); // interpolate
};
  
// Animate Position Helper Function
const rigPosition = (name, position = { x: 0, y: 0, z: 0 }, dampener = 1, lerpAmount = 0.3) => {
	if (!currentVrm) return;

	const Part = currentVrm.humanoid.getBoneNode(
		VRMSchema.HumanoidBoneName[name]
	);

	if (!Part) return;
	let vector = new Vector3(
		position.x * dampener,
		position.y * dampener,
		position.z * dampener
	);

	Part.position.lerp(vector, lerpAmount); // interpolate
};
  
let oldLookTarget = new Euler()
const rigFace = (riggedFace) => {
	if (!currentVrm) {
		return;
	}
	
	rigRotation("Neck", riggedFace.head, 0.7);

	// Blendshapes and Preset Name Schema
	const Blendshape = currentVrm.blendShapeProxy;
	const PresetName = VRMSchema.BlendShapePresetName;

	// Simple example without winking. Interpolate based on old blendshape, then stabilize blink with `Kalidokit` helper function.
	// for VRM, 1 is closed, 0 is open.
	riggedFace.eye.l = lerp(clamp(1 - riggedFace.eye.l, 0, 1), Blendshape.getValue(PresetName.Blink), .5)
	riggedFace.eye.r = lerp(clamp(1 - riggedFace.eye.r, 0, 1), Blendshape.getValue(PresetName.Blink), .5)
	riggedFace.eye = Kalidokit.Face.stabilizeBlink(riggedFace.eye,riggedFace.head.y)
	Blendshape.setValue(PresetName.Blink, riggedFace.eye.l);

	// Interpolate and set mouth blendshapes
	Blendshape.setValue(PresetName.I, lerp(riggedFace.mouth.shape.I, Blendshape.getValue(PresetName.I), .5));
	Blendshape.setValue(PresetName.A, lerp(riggedFace.mouth.shape.A, Blendshape.getValue(PresetName.A), .5));
	Blendshape.setValue(PresetName.E, lerp(riggedFace.mouth.shape.E, Blendshape.getValue(PresetName.E), .5));
	Blendshape.setValue(PresetName.O, lerp(riggedFace.mouth.shape.O, Blendshape.getValue(PresetName.O), .5));
	Blendshape.setValue(PresetName.U, lerp(riggedFace.mouth.shape.U, Blendshape.getValue(PresetName.U), .5));

	//PUPILS
	//interpolate pupil and keep a copy of the value
	let lookTarget = new Euler(
		lerp(oldLookTarget.x , riggedFace.pupil.y, .4),
		lerp(oldLookTarget.y, riggedFace.pupil.x, .4),
		0,
		"XYZ"
	)
	oldLookTarget.copy(lookTarget)
	currentVrm.lookAt.applyer.lookAt(lookTarget);
};

// TODO: Create a custom rig solver
const animateVRM = (vrm, results) => {
	if (!vrm) {
		return;
	}

	// Take the results from `Holistic` and animate character based on its Face, Pose, and Hand Keypoints.
	let riggedPose, riggedLeftHand, riggedRightHand, riggedFace;

	const faceLandmarks = results.faceLandmarks;
	// Pose 3D Landmarks are with respect to Hip distance in meters
	const pose3DLandmarks = results.ea;
	// Pose 2D landmarks are with respect to videoWidth and videoHeight
	const pose2DLandmarks = results.poseLandmarks;
	// Be careful, hand landmarks may be reversed
	const leftHandLandmarks = results.rightHandLandmarks;
	const rightHandLandmarks = results.leftHandLandmarks;

	// Animate Face
	if (faceLandmarks) {
		riggedFace = Kalidokit.Face.solve(faceLandmarks,{
			runtime:"mediapipe",
			video:videoElement
		});
		rigFace(riggedFace);
	}

	// Animate Pose
	if (pose2DLandmarks && pose3DLandmarks) {
		riggedPose = Kalidokit.Pose.solve(pose3DLandmarks, pose2DLandmarks, {
			runtime: "mediapipe",
			video:videoElement,
		});
		rigRotation("Hips", riggedPose.Hips.rotation, 0.7);
		rigPosition(
			"Hips",
			{
				x: -riggedPose.Hips.position.x, // Reverse direction
				y:  riggedPose.Hips.position.y + 1, // Add a bit of height
				z: -riggedPose.Hips.position.z // Reverse direction
			},
			1,
			0.07
		);

		rigRotation("Chest", riggedPose.Spine, 0.25, .3);
		rigRotation("Spine", riggedPose.Spine, 0.45, .3);

		rigRotation("RightUpperArm", riggedPose.RightUpperArm, 1, .3);
		rigRotation("RightLowerArm", riggedPose.RightLowerArm, 1, .3);
		rigRotation("LeftUpperArm", riggedPose.LeftUpperArm, 1, .3);
		rigRotation("LeftLowerArm", riggedPose.LeftLowerArm, 1, .3);

		rigRotation("LeftUpperLeg", riggedPose.LeftUpperLeg, 1, .3);
		rigRotation("LeftLowerLeg", riggedPose.LeftLowerLeg, 1, .3);
		rigRotation("RightUpperLeg", riggedPose.RightUpperLeg, 1, .3);
		rigRotation("RightLowerLeg", riggedPose.RightLowerLeg, 1, .3);
	}

	// Animate Hands
	if (leftHandLandmarks) {
		riggedLeftHand = Kalidokit.Hand.solve(leftHandLandmarks, "Left");
		rigRotation("LeftHand", {
			// Combine pose rotation Z and hand rotation X Y
			z: riggedPose.LeftHand.z,
			y: riggedLeftHand.LeftWrist.y,
			x: riggedLeftHand.LeftWrist.x
		});
		rigRotation("LeftRingProximal", riggedLeftHand.LeftRingProximal);
		rigRotation("LeftRingIntermediate", riggedLeftHand.LeftRingIntermediate);
		rigRotation("LeftRingDistal", riggedLeftHand.LeftRingDistal);
		rigRotation("LeftIndexProximal", riggedLeftHand.LeftIndexProximal);
		rigRotation("LeftIndexIntermediate", riggedLeftHand.LeftIndexIntermediate);
		rigRotation("LeftIndexDistal", riggedLeftHand.LeftIndexDistal);
		rigRotation("LeftMiddleProximal", riggedLeftHand.LeftMiddleProximal);
		rigRotation("LeftMiddleIntermediate", riggedLeftHand.LeftMiddleIntermediate);
		rigRotation("LeftMiddleDistal", riggedLeftHand.LeftMiddleDistal);
		rigRotation("LeftThumbProximal", riggedLeftHand.LeftThumbProximal);
		rigRotation("LeftThumbIntermediate", riggedLeftHand.LeftThumbIntermediate);
		rigRotation("LeftThumbDistal", riggedLeftHand.LeftThumbDistal);
		rigRotation("LeftLittleProximal", riggedLeftHand.LeftLittleProximal);
		rigRotation("LeftLittleIntermediate", riggedLeftHand.LeftLittleIntermediate);
		rigRotation("LeftLittleDistal", riggedLeftHand.LeftLittleDistal);
	}

	if (rightHandLandmarks) {
		riggedRightHand = Kalidokit.Hand.solve(rightHandLandmarks, "Right");
		rigRotation("RightHand", {
			// Combine Z axis from pose hand and X/Y axis from hand wrist rotation
			z: riggedPose.RightHand.z,
			y: riggedRightHand.RightWrist.y,
			x: riggedRightHand.RightWrist.x
		});
		rigRotation("RightRingProximal", riggedRightHand.RightRingProximal);
		rigRotation("RightRingIntermediate", riggedRightHand.RightRingIntermediate);
		rigRotation("RightRingDistal", riggedRightHand.RightRingDistal);
		rigRotation("RightIndexProximal", riggedRightHand.RightIndexProximal);
		rigRotation("RightIndexIntermediate",riggedRightHand.RightIndexIntermediate);
		rigRotation("RightIndexDistal", riggedRightHand.RightIndexDistal);
		rigRotation("RightMiddleProximal", riggedRightHand.RightMiddleProximal);
		rigRotation("RightMiddleIntermediate", riggedRightHand.RightMiddleIntermediate);
		rigRotation("RightMiddleDistal", riggedRightHand.RightMiddleDistal);
		rigRotation("RightThumbProximal", riggedRightHand.RightThumbProximal);
		rigRotation("RightThumbIntermediate", riggedRightHand.RightThumbIntermediate);
		rigRotation("RightThumbDistal", riggedRightHand.RightThumbDistal);
		rigRotation("RightLittleProximal", riggedRightHand.RightLittleProximal);
		rigRotation("RightLittleIntermediate", riggedRightHand.RightLittleIntermediate);
		rigRotation("RightLittleDistal", riggedRightHand.RightLittleDistal);
	}
};

let videoElement = document.querySelector(".InputVideo");
let guideCanvas = document.querySelector('.GuideCanvas');

const onResults = (results) => {
	// Draw landmark guides
	drawResults(results);
	// Animate model
	if (currentVrm) {
		try {
			animateVRM(currentVrm, results);
		} catch (error) {
			console.error(error);
		}
	}
};

const drawResults = (results) => {
	guideCanvas.width = videoElement.videoWidth;
	guideCanvas.height = videoElement.videoHeight;
	
	let canvasCtx = guideCanvas.getContext('2d');
	canvasCtx.save();
	canvasCtx.clearRect(0, 0, guideCanvas.width, guideCanvas.height);

	// Use `Mediapipe` drawing functions
	drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: "#00cff7", lineWidth: 4 });
	drawLandmarks(canvasCtx, results.poseLandmarks, { color: "#ff0364", lineWidth: 2 });
	drawConnectors(canvasCtx, results.faceLandmarks, FACEMESH_TESSELATION, { color: "#C0C0C070", lineWidth: 1 });
	if (results.faceLandmarks && results.faceLandmarks.length === 478) {
		//draw pupils
		drawLandmarks(canvasCtx, [results.faceLandmarks[468],results.faceLandmarks[468+5]], {
			color: "#ffe603",
			lineWidth: 2
		});
	}

	drawConnectors(canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS, { color: "#eb1064", lineWidth: 5 });
	drawLandmarks(canvasCtx, results.leftHandLandmarks, { color: "#00cff7", lineWidth: 2 });
	drawConnectors(canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS, { color: "#22c3e3", lineWidth: 5 });
	drawLandmarks(canvasCtx, results.rightHandLandmarks, { color: "#ff0364", lineWidth: 2 });
}

const holistic = new Holistic({
	locateFile: file => {
		return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5.1635989137/${file}`;
	}
});

holistic.setOptions({
	modelComplexity: 1,
	smoothLandmarks: true,
	minDetectionConfidence: 0.7,
	minTrackingConfidence: 0.7,
	refineFaceLandmarks: true,
});

// Pass holistic a callback function
holistic.onResults(onResults);

function RenderView(props) {
	const [vrm, loadVRM] = useVRM();

	return (
		<div>
			<VRMButton onLoad={(url) => {
				loadVRM(url,
					progress => {
						console.log("Loading model...", 100.0 * (progress.loaded / progress.total), "%");
					},
					error => {
						console.error(error);
					},
					vrm => {
						currentVrm = vrm
					}
				);
			}}>Load new model</VRMButton>
			<VRMButton onLoad={(url) => {
				const camera = new Camera(videoElement, {
					onFrame: async () => {
						await holistic.send({image: videoElement});
					},
					width: 640,
					height: 480
				});
				camera.start();
			}}>Start camera</VRMButton>
			<ProgressBar now={10} />
			
			<div className='Render'>
				<Canvas
					camera={{
						fov: 35,
						near: 0.1,
						far: 1000,
						position: [0.0, 1.4, 0.2]
					}}
				>
					<CameraController />
					<Suspense fallback={<Loader />}>
						<VRMModel vrm={vrm} />
					</Suspense>
					<directionalLight position={[1, 1, 1]} color="#ffffff" />
				</Canvas>
			</div>
		</div>
	);
}

export default RenderView;
