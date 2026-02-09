// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./Errors.sol";

contract ItemStore is Ownable, ReentrancyGuard, Errors {
    using SafeERC20 for IERC20;

    IERC20 public wuxiaToken;
    ERC20Burnable public wuxiaTokenBurnable;
    address public treasury;

    enum BoostType {
        SPEED_START, // +20% starting resources - 10 WUXIA
        VISION_PLUS, // +1 vision range - 15 WUXIA
        LUCKY_SPAWN, // Guaranteed Spirit Vein - 20 WUXIA
        DOUBLE_XP // Rating gain x2 - 25 WUXIA
    }

    enum SubscriptionTier {
        BRONZE, // 100 WUXIA - Unlimited TRAINING games
        SILVER, // 300 WUXIA - Bronze + 50% ARENA discount
        GOLD // 500 WUXIA - Silver + Priority Queue + Beta
    }

    uint256[4] public boostPrices = [10 ether, 15 ether, 20 ether, 25 ether];
    uint256[3] public subscriptionPrices = [100 ether, 300 ether, 500 ether];

    /// @dev Maximum price to prevent owner from setting unreasonable prices
    uint256 public constant MAX_PRICE = 10000 ether;

    /// @dev Maps user addresses to their subscription tier
    mapping(address => SubscriptionTier) public userTier;

    /// @dev Maps user addresses to their subscription expiry timestamp
    mapping(address => uint256) public subscriptionExpiry;

    // Events
    event BoostPurchased(
        address indexed buyer,
        BoostType boostType,
        uint256 amount
    );
    event SubscriptionPurchased(
        address indexed buyer,
        SubscriptionTier tier,
        uint256 expiry
    );
    event UserTierUpdated(
        address indexed user,
        SubscriptionTier oldTier,
        SubscriptionTier newTier
    );
    event TreasuryUpdated(
        address indexed oldTreasury,
        address indexed newTreasury
    );
    event PriceUpdated(
        BoostType indexed boostType,
        uint256 oldPrice,
        uint256 newPrice
    );
    event SubscriptionPriceUpdated(
        SubscriptionTier indexed tier,
        uint256 oldPrice,
        uint256 newPrice
    );
    event TokensWithdrawn(address indexed to, uint256 amount);

    constructor(address _wuxiaToken, address _treasury) Ownable(msg.sender) {
        if (_wuxiaToken == address(0)) revert InvalidToken();
        if (_treasury == address(0)) revert InvalidTreasury();
        wuxiaToken = IERC20(_wuxiaToken);
        wuxiaTokenBurnable = ERC20Burnable(_wuxiaToken);
        treasury = _treasury;
    }

    /**
     * @dev Buy a boost with WUXIA tokens
     * @param boostType The type of boost to purchase
     */
    function buyBoost(BoostType boostType) external nonReentrant {
        uint256 price = boostPrices[uint256(boostType)];
        if (price == 0) revert InvalidBoostType();

        wuxiaToken.safeTransferFrom(msg.sender, address(this), price);
        wuxiaTokenBurnable.burn(price);

        emit BoostPurchased(msg.sender, boostType, price);
    }

    /**
     * @dev Buy a subscription with WUXIA tokens
     * @param tier The subscription tier to purchase
     *
     * NOTE: This function now stores the user's tier on-chain, preventing manipulation.
     * Previously, tier tracking relied on localStorage which users could modify.
     */
    function buySubscription(SubscriptionTier tier) external nonReentrant {
        uint256 price = subscriptionPrices[uint256(tier)];
        if (price == 0) revert InvalidSubscriptionTier();

        wuxiaToken.safeTransferFrom(msg.sender, treasury, price);

        // Store user's tier on-chain
        SubscriptionTier oldTier = userTier[msg.sender];
        userTier[msg.sender] = tier;

        // Extend from max(current expiry, now) to preserve remaining time
        uint256 currentExpiry = subscriptionExpiry[msg.sender];
        uint256 baseTime = currentExpiry > block.timestamp
            ? currentExpiry
            : block.timestamp;
        subscriptionExpiry[msg.sender] = baseTime + 30 days;

        emit SubscriptionPurchased(
            msg.sender,
            tier,
            subscriptionExpiry[msg.sender]
        );

        // Emit tier update event if this is an upgrade
        if (oldTier != tier) {
            emit UserTierUpdated(msg.sender, oldTier, tier);
        }
    }

    /**
     * @dev Check if a user has an active subscription
     * @param user The address to check
     * @return True if the user has an active subscription
     */
    function hasActiveSubscription(address user) external view returns (bool) {
        return subscriptionExpiry[user] > block.timestamp;
    }

    /**
     * @dev Get the subscription tier for a user
     * @param user The address to check
     * @return The user's current subscription tier (BRONZE if not subscribed)
     *
     * NOTE: This function returns the on-chain tier which cannot be manipulated by users.
     * Unlike the previous localStorage-based implementation, this is secure and trustworthy.
     */
    function getUserTier(
        address user
    ) external view returns (SubscriptionTier) {
        if (subscriptionExpiry[user] <= block.timestamp) {
            // Not subscribed or expired - return BRONZE as default
            return SubscriptionTier.BRONZE;
        }
        // Return the stored tier from on-chain mapping
        return userTier[user];
    }

    /**
     * @dev Get remaining subscription time for a user
     * @param user The address to check
     * @return Remaining time in seconds (0 if not subscribed)
     */
    function getSubscriptionTimeRemaining(
        address user
    ) external view returns (uint256) {
        if (subscriptionExpiry[user] <= block.timestamp) return 0;
        return subscriptionExpiry[user] - block.timestamp;
    }

    /**
     * @dev Get complete subscription info for a user
     * @param user The address to check
     * @return tier The user's subscription tier
     * @return expiry The subscription expiry timestamp
     * @return isActive Whether the subscription is currently active
     */
    function getSubscriptionInfo(
        address user
    )
        external
        view
        returns (SubscriptionTier tier, uint256 expiry, bool isActive)
    {
        expiry = subscriptionExpiry[user];
        isActive = expiry > block.timestamp;

        if (!isActive) {
            // Return BRONZE for expired/non-existent subscriptions
            tier = SubscriptionTier.BRONZE;
        } else {
            // Return the on-chain stored tier
            tier = userTier[user];
        }
    }

    /**
     * @dev Get all boost prices at once
     * @return Array of all 4 boost prices
     */
    function getAllBoostPrices() external view returns (uint256[4] memory) {
        return boostPrices;
    }

    /**
     * @dev Get all subscription prices at once
     * @return Array of all 3 subscription prices
     */
    function getAllSubscriptionPrices()
        external
        view
        returns (uint256[3] memory)
    {
        return subscriptionPrices;
    }

    /**
     * @dev Update the treasury address
     * @param newTreasury The new treasury address
     */
    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert InvalidTreasury();
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    /**
     * @dev Set the price for a specific boost
     * @param boostType The boost type to update
     * @param newPrice The new price (must be > 0 and <= MAX_PRICE)
     */
    function setBoostPrice(
        BoostType boostType,
        uint256 newPrice
    ) external onlyOwner {
        if (newPrice == 0 || newPrice > MAX_PRICE) revert PriceOutOfRange();
        uint256 oldPrice = boostPrices[uint256(boostType)];
        boostPrices[uint256(boostType)] = newPrice;
        emit PriceUpdated(boostType, oldPrice, newPrice);
    }

    /**
     * @dev Set the price for a specific subscription tier
     * @param tier The subscription tier to update
     * @param newPrice The new price (must be > 0 and <= MAX_PRICE)
     */
    function setSubscriptionPrice(
        SubscriptionTier tier,
        uint256 newPrice
    ) external onlyOwner {
        if (newPrice == 0 || newPrice > MAX_PRICE) revert PriceOutOfRange();
        uint256 oldPrice = subscriptionPrices[uint256(tier)];
        subscriptionPrices[uint256(tier)] = newPrice;
        emit SubscriptionPriceUpdated(tier, oldPrice, newPrice);
    }

    /**
     * @dev Withdraw tokens from the contract (owner only)
     * @param to The address to withdraw tokens to
     * @param amount The amount to withdraw
     */
    function withdrawTokens(address to, uint256 amount) external onlyOwner {
        wuxiaToken.safeTransfer(to, amount);
        emit TokensWithdrawn(to, amount);
    }
}
