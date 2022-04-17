import React, { Suspense, useEffect, useState } from 'react';
import './VRMStyle.css';

function VRMButton(props) {
	return (
		<div className="VRMButton" onClick={() => {
			const url = "https://cdn.glitch.com/29e07830-2317-4b15-a044-135e73c7f840%2FAshtra.vrm?v=1630342336981";
			console.log(props);
			props.onLoad(url);
		}}>
			{props.children}
		</div>
	);
}

export default VRMButton;
