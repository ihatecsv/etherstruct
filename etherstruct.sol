pragma solidity ^0.4.16;

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
	struct Block {
		address owner;
		uint value;
		uint style;
		uint metadata;
	}

	Block[][][] worldspace;
	uint public worldLimitX;
	uint public worldLimitY;
	uint public worldLimitZ;

	constructor(uint x, uint y, uint z) public {
		worldLimitX = x;
		worldLimitY = y;
		worldLimitZ = z;
	}

	function increaseWorldLimit(uint x, uint y, uint z) public onlyOwner {
       worldLimitX = x > worldLimitX ? x : worldLimitX;
	   worldLimitY = y > worldLimitY ? y : worldLimitY;
	   worldLimitZ = z > worldLimitZ ? z : worldLimitZ;
    }
}