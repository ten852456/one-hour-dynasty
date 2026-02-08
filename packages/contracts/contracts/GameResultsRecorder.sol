// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./IERC8004ReputationRegistry.sol";
import "./Errors.sol";

contract GameResultsRecorder is Ownable, ReentrancyGuard, Errors {
    using SafeERC20 for IERC20;

    IERC20 public prizeToken;
    IERC8004ReputationRegistry public reputationRegistry;

    /// @dev Maximum agents per game to prevent DoS attacks
    uint256 public constant MAX_AGENTS_PER_GAME = 100;

    struct GameResult {
        uint256 gameId;
        address[] agents;
        mapping(address => uint256) ranks;
        mapping(address => uint256) scores;
        bool recorded;
        bool prizesDistributed;
    }

    mapping(uint256 => GameResult) public games;

    event GameRecorded(uint256 indexed gameId, uint256 agentCount);
    event PrizeDistributed(uint256 indexed gameId, address indexed agent, uint256 amount);
    event ReputationSubmitted(address indexed agent, uint256 tokenId, uint8 score);
    event ReputationSubmitFailed(address indexed agent, uint256 tokenId, uint8 score, bytes reason);
    event PrizeTokenWithdrawn(address indexed to, uint256 amount);

    constructor(address _prizeToken, address _reputationRegistry) Ownable(msg.sender) {
        if (_prizeToken == address(0)) revert InvalidPrizeToken();
        if (_reputationRegistry == address(0)) revert InvalidReputationRegistry();
        prizeToken = IERC20(_prizeToken);
        reputationRegistry = IERC8004ReputationRegistry(_reputationRegistry);
    }

    function recordGameResult(
        uint256 gameId,
        address[] calldata agents,
        uint256[] calldata ranks,
        uint256[] calldata scores
    ) external onlyOwner {
        if (agents.length > MAX_AGENTS_PER_GAME) revert TooManyAgents();
        if (agents.length != ranks.length || ranks.length != scores.length) {
            revert ArrayLengthMismatch();
        }
        if (games[gameId].recorded) revert GameAlreadyRecorded();

        GameResult storage game = games[gameId];
        game.gameId = gameId;
        game.agents = agents;
        game.recorded = true;
        game.prizesDistributed = false;

        for (uint256 i = 0; i < agents.length; i++) {
            // Check for duplicate agents
            if (game.ranks[agents[i]] != 0) revert DuplicateAgent();
            // Validate rank and score
            if (ranks[i] == 0) revert InvalidRank();
            if (ranks[i] > 1000000) revert InvalidRank(); // Max reasonable rank
            if (scores[i] > 1000) revert InvalidScore();

            game.ranks[agents[i]] = ranks[i];
            game.scores[agents[i]] = scores[i];
        }

        emit GameRecorded(gameId, agents.length);
    }

    function submitERC8004Feedback(
        uint256 gameId,
        address agent,
        uint256 tokenId,
        string calldata feedbackURI
    ) external onlyOwner {
        if (!games[gameId].recorded) revert GameNotRecorded(gameId);

        uint256 rank = games[gameId].ranks[agent];
        uint8 score = _calculateReputationScore(rank);

        try reputationRegistry.submitFeedback(tokenId, score, feedbackURI) {
            emit ReputationSubmitted(agent, tokenId, score);
        } catch (bytes memory reason) {
            emit ReputationSubmitFailed(agent, tokenId, score, reason);
        }
    }

    function distributePrize(
        uint256 gameId,
        address[] calldata winners,
        uint256[] calldata amounts
    ) external onlyOwner nonReentrant {
        if (!games[gameId].recorded) revert GameNotRecorded(gameId);
        if (games[gameId].prizesDistributed) revert PrizesAlreadyDistributed();
        if (winners.length != amounts.length) revert ArrayLengthMismatch();

        for (uint256 i = 0; i < winners.length; i++) {
            if (amounts[i] == 0) revert InvalidAmount();
            prizeToken.safeTransfer(winners[i], amounts[i]);

            emit PrizeDistributed(gameId, winners[i], amounts[i]);
        }

        games[gameId].prizesDistributed = true;
    }

    function batchDistributePrizes(
        uint256 gameId,
        address[] calldata winners,
        uint256[] calldata amounts
    ) external onlyOwner nonReentrant {
        if (!games[gameId].recorded) revert GameNotRecorded(gameId);
        if (games[gameId].prizesDistributed) revert PrizesAlreadyDistributed();
        if (winners.length != amounts.length) revert ArrayLengthMismatch();

        for (uint256 i = 0; i < winners.length; i++) {
            if (amounts[i] == 0) revert InvalidAmount();
            prizeToken.safeTransfer(winners[i], amounts[i]);
            emit PrizeDistributed(gameId, winners[i], amounts[i]);
        }

        games[gameId].prizesDistributed = true;
    }

    function getAgentRank(uint256 gameId, address agent) external view returns (uint256) {
        return games[gameId].ranks[agent];
    }

    function getAgentScore(uint256 gameId, address agent) external view returns (uint256) {
        return games[gameId].scores[agent];
    }

    /**
     * @dev Calculate reputation score based on rank
     * @param rank The agent's ranking in the game
     * @return Score from 30-100 based on rank tier
     */
    function _calculateReputationScore(uint256 rank) internal pure returns (uint8) {
        if (rank == 1) return 100;
        if (rank <= 3) return 85;
        if (rank <= 10) return 70;
        if (rank <= 25) return 50;
        return 30;
    }

    function withdrawPrizeToken(address to, uint256 amount) external onlyOwner {
        prizeToken.safeTransfer(to, amount);
        emit PrizeTokenWithdrawn(to, amount);
    }
}
