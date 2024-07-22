// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "./Library.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Proxy {
    function setImplementationAddress(address _implementation) external {
        StorageSlot
            .getAddressSlot(keccak256("eip1967.proxy.implementation"))
            .value = _implementation;
    }

    fallback() external {
        (bool s, ) = StorageSlot
            .getAddressSlot(keccak256("eip1967.proxy.implementation"))
            .value
            .delegatecall(msg.data);
        require(s);
    }
}

contract Logic1 {
    uint256 x = 0;

    function changeX(uint256 _x) external {
        x = _x;
    }
}

contract Logic2 {
    uint256 x = 0;

    function changeX(uint256 _x) external {
        x += _x;
    }
}
