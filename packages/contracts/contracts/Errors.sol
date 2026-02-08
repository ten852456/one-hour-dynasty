// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Custom Errors
 * @dev Gas-optimized custom errors for all contracts
 */
contract Errors {
    // Address validation errors
    error InvalidToken();
    error InvalidTreasury();
    error InvalidOwner();
    error InvalidPrizeToken();
    error InvalidReputationRegistry();

    // Supply errors
    error SupplyCapExceeded();

    // Game state errors
    error GameNotRecorded(uint256 gameId);
    error GameAlreadyRecorded();
    error PrizesAlreadyDistributed();

    // Agent validation errors
    error TooManyAgents();
    error DuplicateAgent();
    error InvalidRank();
    error RankExceedsAgents();
    error InvalidScore();

    // Staking errors
    error NoStakeFound();
    error AlreadyStaked();
    error LockPeriodNotExpired();

    // Purchase errors
    error InvalidBoostType();
    error InvalidSubscriptionTier();
    error PriceOutOfRange();

    // Parameter errors
    error ArrayLengthMismatch();
    error AmountMustBePositive();
    error InvalidAmount();
}
