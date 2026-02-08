// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ItemStore is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public wuxiaToken;
    ERC20Burnable public wuxiaTokenBurnable;
    address public treasury;

    enum BoostType {
        SPEED_START,      // +20% starting resources - 10 WUXIA
        VISION_PLUS,      // +1 vision range - 15 WUXIA
        LUCKY_SPAWN,      // Guaranteed Spirit Vein - 20 WUXIA
        DOUBLE_XP         // Rating gain x2 - 25 WUXIA
    }

    enum SubscriptionTier {
        BRONZE,  // 100 WUXIA - Unlimited TRAINING games
        SILVER,  // 300 WUXIA - Bronze + 50% ARENA discount
        GOLD     // 500 WUXIA - Silver + Priority Queue + Beta
    }

    uint256[4] public boostPrices = [10 ether, 15 ether, 20 ether, 25 ether];
    uint256[3] public subscriptionPrices = [100 ether, 300 ether, 500 ether];

    mapping(address => uint256) public subscriptionExpiry;

    event BoostPurchased(address indexed buyer, BoostType boostType);
    event SubscriptionPurchased(address indexed buyer, SubscriptionTier tier, uint256 expiry);

    constructor(address _wuxiaToken, address _treasury) Ownable(msg.sender) {
        wuxiaToken = IERC20(_wuxiaToken);
        wuxiaTokenBurnable = ERC20Burnable(_wuxiaToken);
        treasury = _treasury;
    }

    function buyBoost(BoostType boostType) external nonReentrant {
        uint256 price = boostPrices[uint256(boostType)];
        require(price > 0, "Invalid boost type");

        // Transfer and burn tokens
        wuxiaToken.safeTransferFrom(msg.sender, address(this), price);
        wuxiaTokenBurnable.burn(price);

        emit BoostPurchased(msg.sender, boostType);
    }

    function buySubscription(SubscriptionTier tier) external nonReentrant {
        uint256 price = subscriptionPrices[uint256(tier)];
        require(price > 0, "Invalid subscription tier");

        // Transfer tokens to treasury
        wuxiaToken.safeTransferFrom(msg.sender, treasury, price);

        // Set subscription expiry (30 days from now)
        subscriptionExpiry[msg.sender] = block.timestamp + 30 days;

        emit SubscriptionPurchased(msg.sender, tier, subscriptionExpiry[msg.sender]);
    }

    function hasActiveSubscription(address user) external view returns (bool) {
        return subscriptionExpiry[user] > block.timestamp;
    }

    function setTreasury(address newTreasury) external onlyOwner {
        treasury = newTreasury;
    }

    function setBoostPrice(BoostType boostType, uint256 newPrice) external onlyOwner {
        boostPrices[uint256(boostType)] = newPrice;
    }

    function setSubscriptionPrice(SubscriptionTier tier, uint256 newPrice) external onlyOwner {
        subscriptionPrices[uint256(tier)] = newPrice;
    }

    function withdrawTokens(address to, uint256 amount) external onlyOwner {
        wuxiaToken.safeTransfer(to, amount);
    }
}
