// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../IERC8004ReputationRegistry.sol";

contract MockERC8004Reputation is IERC8004ReputationRegistry {
    struct Submission {
        uint256 tokenId;
        uint8 score;
        string feedbackURI;
    }

    Submission public lastSubmission;

    function submitFeedback(
        uint256 agentTokenId,
        uint8 score,
        string calldata feedbackURI
    ) external override {
        lastSubmission = Submission({
            tokenId: agentTokenId,
            score: score,
            feedbackURI: feedbackURI
        });
    }

    function getLastSubmission() external view returns (Submission memory) {
        return lastSubmission;
    }
}
