pragma solidity ^0.4.16;
pragma experimental ABIEncoderV2;

contract owned {
	address public owner;

	constructor() public {
		owner = msg.sender;
	}

	modifier onlyOwner {
		require(msg.sender == owner, "Only the owner can call this function.");
		_;
	}

	function transferOwnership(address newOwner) external onlyOwner {
		if (newOwner != address(0)) {
			owner = newOwner;
		}
	}
}

contract EtherStruct is owned {
	struct Cube {
		address owner;
		uint lockedFunds;
		uint style;
		uint metadata;
	}

	struct Location {
		uint64 x;
		uint64 y;
		uint64 z;
	}

	function unpackLocation (bytes24 packedLocation) internal pure returns(Location){
		bytes8[3] memory x = [bytes8(0), 0, 0];
		assembly {
			mstore(x, packedLocation)
			mstore(add(x, 56), packedLocation)
			mstore(add(x, 112), packedLocation)
		}
		return Location({
			x: uint64(x[0]),
			y: uint64(x[1]),
			z: uint64(x[2])
		});
	}

	mapping(bytes24 => Cube) worldspace;
	uint public worldCornerX;
	uint public worldCornerY;
	uint public worldCornerZ;

	constructor(bytes24 packedLocation) public {
		Location memory location = unpackLocation(packedLocation);

		worldCornerX = location.x;
		worldCornerY = location.y;
		worldCornerZ = location.z;
	}

	function increaseWorldCorner(bytes24 packedLocation) external onlyOwner {
		Location memory location = unpackLocation(packedLocation);

		// Ensure we can't shrink the world to make cubes inaccessible
		require(location.x >= worldCornerX && location.y >= worldCornerY && location.z >= worldCornerZ);

		// Set the new world limit
		worldCornerX = location.x;
		worldCornerY = location.y;
		worldCornerZ = location.z;
	}

	function placeCube(bytes24 packedLocation, uint style, uint metadata) external payable {
		Location memory location = unpackLocation(packedLocation);

		// Ensure the new cube is within bounds
		require(location.x < worldCornerX && location.y < worldCornerY && location.z < worldCornerZ);
		
		Cube memory existingCube = worldspace[packedLocation];

		// Ensure the request is exceeding the previously locked value
		require(msg.value > existingCube.lockedFunds);

		if(existingCube.owner != 0x0)
			returnLockedFunds(existingCube);

		worldspace[packedLocation] = Cube({
			owner: msg.sender,
			lockedFunds: msg.value,
			style: style,
			metadata: metadata
		});
	}

	function returnLockedFunds(Cube cube) internal {
		cube.owner.transfer(cube.lockedFunds);
	}
}