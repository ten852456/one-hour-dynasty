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

    struct Stake {
        uint256 amount;
        uint256 timestamp;
        uint256 lockDuration;
    }

    mapping(address => Stake) public stakes;

    uint256 public constant PRIORITY_STAKE = 1000 ether;
    uint256 public constant GRAND_WAR_STAKE = 5000 ether;
    uint256 public constant GOVERNANCE_STAKE = 10000 ether;

    event Staked(address indexed user, uint256 amount, uint256 lockDuration);
    event Unstaked(address indexed user, uint256 amount);

    constructor(address _wuxiaToken) Ownable(msg.sender) {
        if (_wuxiaToken == address(0)) revert InvalidToken();
        wuxiaToken = IERC20(_wuxiaToken);
    }

    function stake(uint256 amount, uint256 lockDuration) external nonReentrant {
        if (amount == 0) revert AmountMustBePositive();
        if (stakes[msg.sender].amount > 0) revert AlreadyStaked();

        wuxiaToken.safeTransferFrom(msg.sender, address(this), amount);

        stakes[msg.sender] = Stake({
            amount: amount,
            timestamp: block.timestamp,
            lockDuration: lockDuration
        });

        emit Staked(msg.sender, amount, lockDuration);
    }

    function unstake() external nonReentrant {
        Stake memory userStake = stakes[msg.sender];
        if (userStake.amount == 0) revert NoStakeFound();

        if (userStake.lockDuration > 0) {
            if (
                block.timestamp < userStake.timestamp + userStake.lockDuration
            ) {
                revert LockPeriodNotExpired();
            }
        }

        uint256 amount = userStake.amount;
        delete stakes[msg.sender];

        wuxiaToken.safeTransfer(msg.sender, amount);

        emit Unstaked(msg.sender, amount);
    }

    function hasPriorityQueue(address user) external view returns (bool) {
        return stakes[user].amount >= PRIORITY_STAKE;
    }

    function canAccessGrandWar(address user) external view returns (bool) {
        return stakes[user].amount >= GRAND_WAR_STAKE;
    }

    function hasGovernanceRights(address user) external view returns (bool) {
        return stakes[user].amount >= GOVERNANCE_STAKE;
    }

    function getStake(address user) external view returns (Stake memory) {
        return stakes[user];
    }
}
