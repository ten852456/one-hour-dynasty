// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Errors.sol";

/**
 * @title WuxiaToken
 * @dev ERC20 token for One Hour Dynasty game with burnable functionality
 * @custom:security-contact security@onehourdynasty.com
 */
contract WuxiaToken is ERC20, ERC20Burnable, Ownable, Errors {
    /// @dev Maximum supply cap to ensure fixed supply (100,000,000 tokens)
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10**18;

    /**
     * @dev Constructor that mints the entire supply to the deployer
     * @param initialOwner The address that will receive the initial token supply and become the owner
     */
    constructor(address initialOwner) ERC20("WUXIA", "WUXIA") Ownable(initialOwner) {
        if (initialOwner == address(0)) revert InvalidOwner();
        _mint(initialOwner, MAX_SUPPLY);
    }

    /**
     * @dev Mint new tokens to a specified address (for emission schedule)
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) public onlyOwner {
        if (to == address(0)) revert InvalidOwner();
        if (totalSupply() + amount > MAX_SUPPLY) revert SupplyCapExceeded();
        _mint(to, amount);
    }
}
