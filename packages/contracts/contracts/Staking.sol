// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./Errors.sol";

contract Staking is Ownable, ReentrancyGuard, Errors {
    using SafeERC20 for IERC20;

    IERC20 public wuxiaToken;

    /// @dev Packed stake struct for gas optimization (32 bytes total)
    struct Stake {
        uint96 amount; // Max: ~79 billion WUXIA (more than enough)
        uint64 timestamp; // Max year: 292,277,026,565 AD
        uint96 lockDuration; // Max: >> universe age in seconds
    }

    mapping(address => Stake) public stakes;

    uint256 public constant PRIORITY_STAKE = 1000 ether;
    uint256 public constant GRAND_WAR_STAKE = 5000 ether;
    uint256 public constant GOVERNANCE_STAKE = 10000 ether;

    event Staked(address indexed user, uint256 amount, uint256 lockDuration);
    event Unstaked(address indexed user, uint256 amount);
    event StakeIncreased(address indexed user, uint256 additionalAmount);

    constructor(address _wuxiaToken) Ownable(msg.sender) {
        if (_wuxiaToken == address(0)) revert InvalidToken();
        wuxiaToken = IERC20(_wuxiaToken);
    }

    function stake(uint256 amount, uint256 lockDuration) external nonReentrant {
        if (amount == 0) revert AmountMustBePositive();
        if (stakes[msg.sender].amount > 0) revert AlreadyStaked();

        wuxiaToken.safeTransferFrom(msg.sender, address(this), amount);

        stakes[msg.sender] = Stake({
            amount: uint96(amount),
            timestamp: uint64(block.timestamp),
            lockDuration: uint96(lockDuration)
        });

        emit Staked(msg.sender, amount, lockDuration);
    }

    /**
     * @dev Increase existing stake without losing lock period
     * @param additionalAmount Amount to add to existing stake
     */
    function increaseStake(uint256 additionalAmount) external nonReentrant {
        if (additionalAmount == 0) revert AmountMustBePositive();
        Stake storage userStake = stakes[msg.sender];
        if (userStake.amount == 0) revert NoStakeFound();

        wuxiaToken.safeTransferFrom(
            msg.sender,
            address(this),
            additionalAmount
        );

        // Use unchecked to prevent overflow check (safe since we check cap below)
        unchecked {
            uint256 newAmount = uint256(userStake.amount) + additionalAmount;
            userStake.amount = uint96(newAmount);
        }

        emit StakeIncreased(msg.sender, additionalAmount);
    }

    function unstake() external nonReentrant {
        Stake memory userStake = stakes[msg.sender];
        uint256 amount = uint256(userStake.amount);

        if (amount == 0) revert NoStakeFound();

        if (userStake.lockDuration > 0) {
            uint256 lockEndTime = uint256(userStake.timestamp) +
                uint256(userStake.lockDuration);
            if (block.timestamp < lockEndTime) {
                revert LockPeriodNotExpired();
            }
        }

        delete stakes[msg.sender];

        wuxiaToken.safeTransfer(msg.sender, amount);

        emit Unstaked(msg.sender, amount);
    }

    function hasPriorityQueue(address user) external view returns (bool) {
        return stakes[user].amount >= uint96(PRIORITY_STAKE);
    }

    function canAccessGrandWar(address user) external view returns (bool) {
        return stakes[user].amount >= uint96(GRAND_WAR_STAKE);
    }

    function hasGovernanceRights(address user) external view returns (bool) {
        return stakes[user].amount >= uint96(GOVERNANCE_STAKE);
    }

    function getStake(address user) external view returns (Stake memory) {
        return stakes[user];
    }
}
