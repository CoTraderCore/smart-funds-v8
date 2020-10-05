pragma solidity ^0.6.12;

import "./SmartFundLightCore.sol";

/*
  Note: this smart fund inherits SmartFundLightCore and make core operations like deposit,
  calculate fund value etc in ETH
*/
contract SmartFundETHLight is SmartFundLightCore {
  using SafeMath for uint256;
  using SafeERC20 for IERC20;

  /**
  * @dev constructor
  *
  * @param _owner                        Address of the fund manager
  * @param _name                         Name of the fund, required for DetailedERC20 compliance
  * @param _successFee                   Percentage of profit that the fund manager receives
  * @param _platformAddress              Address of platform to send fees to
  * @param _exchangePortalAddress        Address of initial exchange portal
  * @param _permittedAddresses           Address of permittedAddresses contract
  * @param _isRequireTradeVerification   If true fund will require verification from Merkle White list for each new asset
  */
  constructor(
    address _owner,
    string memory _name,
    uint256 _successFee,
    address _platformAddress,
    address _exchangePortalAddress,
    address _permittedAddresses,
    bool    _isRequireTradeVerification
  )
  SmartFundLightCore(
    _owner,
    _name,
    _successFee,
    _platformAddress,
    _exchangePortalAddress,
    _permittedAddresses,
    address(0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee),
    _isRequireTradeVerification
  )
  public{}

  /**
  * @dev Deposits ether into the fund and allocates a number of shares to the sender
  * depending on the current number of shares, the funds value, and amount deposited
  *
  * @return The amount of shares allocated to the depositor
  */
  function deposit() external payable returns (uint256) {
    // Check if the sender is allowed to deposit into the fund
    if (onlyWhitelist)
      require(whitelist[msg.sender]);

    // Require that the amount sent is not 0
    require(msg.value != 0, "ZERO_DEPOSIT");

    totalWeiDeposited += msg.value;

    // Calculate number of shares
    uint256 shares = calculateDepositToShares(msg.value);

    // If user would receive 0 shares, don't continue with deposit
    require(shares != 0, "ZERO_SHARES");

    // Add shares to total
    totalShares = totalShares.add(shares);

    // Add shares to address
    addressToShares[msg.sender] = addressToShares[msg.sender].add(shares);

    addressesNetDeposit[msg.sender] += int256(msg.value);

    // update total tx
    totalTransactionsCount += 1;

    emit Deposit(msg.sender, msg.value, shares, totalShares);

    return shares;
  }
}
