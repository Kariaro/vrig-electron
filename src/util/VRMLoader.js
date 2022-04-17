import React, { useCallback, useEffect, useState, useRef } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VRM } from '@pixiv/three-vrm';

function useVRM() {
	const loader = new GLTFLoader();
	const [ vrm, setVRM ] = useState(null);
	loader.crossOrigin = "anonymous";

	const loadVRM = useCallback((url, progress, error, result=(vrm) => {}) => {
		new Promise(resolve => loader.load(url, resolve, progress, error)).then((gltf) => {
			VRM.from(gltf).then(vrm => {
				vrm.scene.rotation.y = Math.PI; // Rotate model 180deg to face camera
				setVRM(vrm);
				result(vrm);
			});
		});
	}, []);
	
	return [ vrm, loadVRM ];
}

export { useVRM };
