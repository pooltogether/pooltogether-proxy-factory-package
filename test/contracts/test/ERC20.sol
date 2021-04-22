// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract ERC20 is ERC20Upgradeable{
    function initialize(string memory name, string memory symbol, uint8 decimals) public {
        __ERC20_init(name, symbol);
        _setupDecimals(decimals);
    }

    function willRevert() public pure {
        // will always revert
        require(false, "ERC20-willRevert");   
    }
}


