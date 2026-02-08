// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title WuxiaToken
 * @dev ERC20 token for One Hour Dynasty game with burnable functionality
 * @custom:security-contact security@onehourdynasty.com
 */
contract WuxiaToken is ERC20, ERC20Burnable, Ownable {
    /// @dev Total supply constant: 100,000,000 tokens (100 million)
    uint256 public constant TOTAL_SUPPLY = 100_000_000 * 10**18;

    /**
     * @dev Constructor that mints the entire supply to the deployer
     * @param initialOwner The address that will receive the initial token supply and become the owner
     */
    constructor(address initialOwner) ERC20("WUXIA", "WUXIA") Ownable(initialOwner) {
        _mint(initialOwner, TOTAL_SUPPLY);
    }

    /**
     * @dev Mint new tokens to a specified address
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
