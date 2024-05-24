// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RedVsBlue
 * @dev This contract allows users to bet on one of two teams using btc tokens.
 * The owner can decide the winning team, and users who bet on the winning team
 * can withdraw their deposit plus a proportional share of the losing team's total deposits.
 */
contract RedVsBlue is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;

    enum Team {None, Red, Blue}
    enum GameState {Open, Closed, Defaulted}

    struct Bet {
        uint256 amount;
        Team team;
    }

    uint256 public constant MIN_BET = 50 * 10**8; // Minimum bet amount: 50 BTC (assuming 8 decimals)
    uint256 public constant MAX_BET = 10000 * 10**8; // Maximum bet amount: 10000 BTC (assuming 8 decimals)

    GameState public gameState;
    Team public winningTeam;
    uint256 public totalRedBets;
    uint256 public totalBlueBets;

    mapping(address => Bet) public bets;

    /**
     * @dev Emitted when a user places a bet.
     * @param user The address of the user.
     * @param team The team on which the user bet.
     * @param amount The amount of the bet.
     */
    event BetPlaced(address indexed user, Team indexed team, uint256 amount);

    /**
     * @dev Emitted when the owner closes the game and declares a winner.
     * @param winningTeam The team that won.
     */
    event GameClosed(Team indexed winningTeam);

    /**
     * @dev Emitted when the owner defaults the game.
     */
    event GameDefaulted();

    /**
     * @dev Initializes the contract with the ERC20 token address.
     * @param _token The address of the ERC20 token used for betting.
     */
    constructor(
        IERC20 _token) Ownable(msg.sender) {
        token = _token;
        gameState = GameState.Open;
    }

    /**
     * @notice Places a bet on a team.
     * @dev Users can only place a bet when the game is open.
     * @param team The team to bet on (1 for Red, 2 for Blue).
     * @param amount The amount to bet.
     */
    function placeBet(Team team, uint256 amount) external {
        require(gameState == GameState.Open, "Betting is closed");
        require(team == Team.Red || team == Team.Blue, "Invalid team");
        require(amount >= MIN_BET && amount <= MAX_BET, "Bet amount out of range");
        require(bets[msg.sender].amount == 0, "User has already placed a bet");

        token.safeTransferFrom(msg.sender, address(this), amount);

        bets[msg.sender] = Bet({amount: amount, team: team});

        if (team == Team.Red) {
            totalRedBets += amount;
        } else {
            totalBlueBets += amount;
        }

        emit BetPlaced(msg.sender, team, amount);
    }

    /**
     * @notice Closes the game and declares the winning team.
     * @dev Only the owner can close the game and declare a winner.
     * @param _winningTeam The team that won (1 for Red, 2 for Blue).
     */
    function closeGame(Team _winningTeam) external onlyOwner {
        require(gameState == GameState.Open, "Game is not open");
        require(_winningTeam == Team.Red || _winningTeam == Team.Blue, "Invalid winning team");

        gameState = GameState.Closed;
        winningTeam = _winningTeam;

        emit GameClosed(_winningTeam);
    }

    /**
     * @notice Defaults the game and allows users to reclaim their deposits.
     * @dev Only the owner can default the game.
     */
    function defaultGame() external onlyOwner {
        require(gameState == GameState.Open, "Game is not open");

        gameState = GameState.Defaulted;

        emit GameDefaulted();
    }

    /**
     * @notice Withdraws the bet and winnings (if any).
     * @dev Users can withdraw only after the game is closed or defaulted.
     */
    function withdraw() external {
        Bet storage userBet = bets[msg.sender];
        require(userBet.amount > 0, "No bet placed");

        uint256 payout;

        if (gameState == GameState.Closed) {
            require(userBet.team == winningTeam, "You bet on the losing team");

            uint256 totalLosingBets = (winningTeam == Team.Red) ? totalBlueBets : totalRedBets;
            payout = userBet.amount + (userBet.amount * totalLosingBets / (winningTeam == Team.Red ? totalRedBets : totalBlueBets));
        } else if (gameState == GameState.Defaulted) {
            payout = userBet.amount;
        } else {
            revert("Game is still open");
        }

        delete bets[msg.sender];
        token.safeTransfer(msg.sender, payout);
    }
}
