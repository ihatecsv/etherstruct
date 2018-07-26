window.addEventListener("load", function() {
	if (typeof web3 !== 'undefined') {
		var provider = web3.currentProvider;
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

	const getBlockAt = function(x, y, z, cb){
		etherstruct.worldspace.call([packLocation(x, y, z)], function(err, data){
			cb(err, data[2]);
		});
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
		// world
		const gridSize = 10;
		var geometry = new THREE.BoxBufferGeometry(gridSize, gridSize, gridSize);
		var material = new THREE.MeshPhongMaterial( { color: 0xffffff, flatShading: true } );
		for(let x = 0; x < 4; x++){
			for(let y = 0; y < 4; y++){
				for(let z = 0; z < 4; z++){
					getBlockAt(x, y, z, function(err, blockType){
						if(err) return console.error(err);
						if(blockType == 0) return;
						console.log("Placed " + blockType + " at " + [x, y, z]);
						var mesh = new THREE.Mesh( geometry, material );
						mesh.position.x = x*gridSize;
						mesh.position.y = y*gridSize;
						mesh.position.z = z*gridSize;
						mesh.updateMatrix();
						mesh.matrixAutoUpdate = false;
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
		renderer.render( scene, camera );
	}
});