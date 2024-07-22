// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Proxy {
    uint256 x = 0;
    address implementation;

    function setImplementationAddress(address _implementation) external {
        implementation = _implementation;
    }

    fallback() external {
        (bool s, ) = implementation.delegatecall(msg.data);
        require(s);
    }
}

contract Logic1 {
    uint256 x = 0;

    function changeX(uint256 _x) external {
        x = _x;
    }
}
