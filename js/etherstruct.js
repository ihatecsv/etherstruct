window.addEventListener("load", function() {
	if (typeof web3 !== 'undefined') {
		const provider = web3.currentProvider;
	} else {
		console.log('No web3? You should consider trying MetaMask!');
	}

	const abi = [{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"worldspace","outputs":[{"name":"owner","type":"address"},{"name":"lockedFunds","type":"uint256"},{"name":"style","type":"uint256"},{"name":"metadata","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"worldCornerX","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"worldCornerY","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"x","type":"uint64"},{"name":"y","type":"uint64"},{"name":"z","type":"uint64"},{"name":"style","type":"uint256"},{"name":"metadata","type":"uint256"}],"name":"placeCube","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[{"name":"x","type":"uint64"},{"name":"y","type":"uint64"},{"name":"z","type":"uint64"}],"name":"packLocation","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[],"name":"worldCornerZ","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newWorldCornerX","type":"uint64"},{"name":"newWorldCornerY","type":"uint64"},{"name":"newWorldCornerZ","type":"uint64"}],"name":"increaseWorldCorner","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"startingWorldCornerX","type":"uint64"},{"name":"startingWorldCornerY","type":"uint64"},{"name":"startingWorldCornerZ","type":"uint64"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"}];
	const EtherStruct = web3.eth.contract(abi);
	const etherstruct = EtherStruct.at("0x2e25fde22e0246a969c474fc2017002924038443");

	BigNumber.config({ EXPONENTIAL_AT: 1e+9 });

	const packLocation = function(x, y, z){
		const xPart = x.toString(16).padStart(16, "0");
		const yPart = y.toString(16).padStart(16, "0");
		const zPart = z.toString(16).padStart(16, "0");
		return new BigNumber("0x" + xPart + yPart + zPart);
	}

	const getCubeAt = function(x, y, z, cb){
		etherstruct.worldspace.call([packLocation(x, y, z)], function(err, data){
			cb(err, data[2]);
		});
	}

	const createCubeMaterial = function(x, y, z, cubeType){
		const texCanvas = document.createElement("canvas");
		const texCanvasCtx = texCanvas.getContext("2d");
		const texCanvasSize = 128;

		texCanvas.width = texCanvas.height = texCanvasSize;
		texCanvasCtx.shadowColor = "#000";
		texCanvasCtx.shadowBlur = 7;
		texCanvasCtx.fillStyle = "#aaa";
		texCanvasCtx.fillRect(0, 0, texCanvasSize, texCanvasSize);
		texCanvasCtx.fillStyle = "#a00";
		texCanvasCtx.font = "30pt arial bold";
		texCanvasCtx.fillText(cubeType, texCanvasSize/2, texCanvasSize/2);
		texCanvasCtx.font = "15pt arial bold";
		texCanvasCtx.fillText([x, y, z], 10, 15);

		const mat = new THREE.MeshBasicMaterial({ map: new THREE.Texture(texCanvas), transparent: true });
		mat.map.needsUpdate = true;

		return mat;
	}

	// world
	const gridSize = 10;
	const cubeGeometry = new THREE.BoxBufferGeometry(gridSize, gridSize, gridSize);

	const cubeGhostMaterial = new THREE.MeshBasicMaterial({
		color: 0xff0000,
		wireframe: true
	});

	const ghostObject = new THREE.Mesh(cubeGeometry, cubeGhostMaterial);
	ghostObject.visible = false;
	ghostObject.updateMatrix();

	window.addEventListener("click", function(){
		if(ghostObject.visible){
			const clickedBlock = {x: ghostObject.position.x/gridSize, y: ghostObject.position.y/gridSize, z: ghostObject.position.z/gridSize};
			$("#x-coord").val(clickedBlock.x);
			$("#y-coord").val(clickedBlock.y);
			$("#z-coord").val(clickedBlock.z);
			$("#build-modal").modal("show");
		}
	});

	$("#build-button").click(function(){
		const bidPrice = parseFloat($("#bid-price").val());
		const xCoord = parseInt($("#x-coord").val());
		const yCoord = parseInt($("#y-coord").val());
		const zCoord = parseInt($("#z-coord").val());
		const cubeStyle = parseInt($("#cube-style").val());
		etherstruct.placeCube(xCoord, yCoord, zCoord, cubeStyle, 0, {
			from: web3.eth.accounts[0], value: web3.toWei(bidPrice, "ether")
		}, function(err, result){
			if(err) console.error(err);
			if(result) console.log(result);
		});
	});

	var raycaster = new THREE.Raycaster();
	var mouse = new THREE.Vector2();

	function onMouseMove( event ) {
		mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
		mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
	}

	var camera, controls, scene, renderer;

	init();
	//render(); // remove when using next line for animation loop (requestAnimationFrame)
	animate();
	function init() {
		scene = new THREE.Scene();
		scene.background = new THREE.Color( 0xcccccc );
		scene.fog = new THREE.FogExp2( 0xcccccc, 0.002 );
		renderer = new THREE.WebGLRenderer( { antialias: true } );
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( window.innerWidth, window.innerHeight );
		document.body.appendChild( renderer.domElement );
		renderer.domElement.addEventListener("mousemove", onMouseMove);
		camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 1000 );
		camera.position.set( 400, 200, 0 );
		// controls
		controls = new THREE.OrbitControls( camera, renderer.domElement );
		//controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)
		controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
		controls.dampingFactor = 0.25;
		controls.screenSpacePanning = false;
		controls.minDistance = 100;
		controls.maxDistance = 500
		controls.maxPolarAngle = Math.PI / 2;

		scene.add(ghostObject);

		for(let x = 0; x < 8; x++){
			for(let y = 0; y < 8; y++){
				for(let z = 0; z < 8; z++){
					getCubeAt(x, y, z, function(err, cubeType){
						if(err) return console.error(err);
						if(cubeType == 0) return;
						console.log("Placed " + cubeType + " at " + [x, y, z]);

						const cubeMaterial = createCubeMaterial(x, y, z, cubeType);
						var mesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
						mesh.position.x = x * gridSize;
						mesh.position.y = y * gridSize;
						mesh.position.z = z * gridSize;
						mesh.updateMatrix();
						scene.add(mesh);
					});
				}
			}
		}
		// lights
		var light = new THREE.DirectionalLight( 0xffffff );
		light.position.set( 1, 1, 1 );
		scene.add( light );
		var light = new THREE.DirectionalLight( 0x002288 );
		light.position.set( - 1, - 1, - 1 );
		scene.add( light );
		var light = new THREE.AmbientLight( 0x222222 );
		scene.add( light );
		//
		window.addEventListener( 'resize', onWindowResize, false );
	}
	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight );
	}
	function animate() {
		requestAnimationFrame( animate );
		controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true
		render();
	}
	function render() {
		ghostObject.visible = false;
		raycaster.setFromCamera(mouse, camera);
		var intersects = raycaster.intersectObjects(scene.children);

		const renderGhost = function(intersectPos, blockPos, val){
			if(Math.abs(intersectPos[val] - Math.round(intersectPos[val])) < 0.001){
				const ghostPos = {x: blockPos.x, y: blockPos.y, z: blockPos.z};
				let adjustment = 0;
				if(blockPos[val] < intersectPos[val]){
					adjustment += gridSize;
				}else{
					adjustment -= gridSize;
				}
				ghostPos[val] = ghostPos[val] + adjustment;
				if(ghostPos[val] < 0) return;
				ghostObject.visible = true;
				ghostObject.position.x = ghostPos.x;
				ghostObject.position.y = ghostPos.y;
				ghostObject.position.z = ghostPos.z;
			}
		}

		for(let i = intersects.length - 1; i >= 0 ; i--){
			renderGhost(intersects[i].point, intersects[i].object.position, "x");
			renderGhost(intersects[i].point, intersects[i].object.position, "y");
			renderGhost(intersects[i].point, intersects[i].object.position, "z");
		}
		//intersects[i].object.material.color.set(0xff0000);

		renderer.render(scene, camera);
	}
});