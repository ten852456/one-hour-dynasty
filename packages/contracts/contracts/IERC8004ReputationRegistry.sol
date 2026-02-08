// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC8004ReputationRegistry {
    function submitFeedback(
        uint256 agentTokenId,
        uint8 score,
        string calldata feedbackURI
    ) external;
}
