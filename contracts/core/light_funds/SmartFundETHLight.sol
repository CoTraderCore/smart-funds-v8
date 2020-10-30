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
  * @param _exchangePortalAddress        Address of initial exchange portal
  * @param _permittedAddresses           Address of permittedAddresses contract
  * @param _fundValueOracle              Address of Oracle contract
  * @param _isRequireTradeVerification   If true fund will require verification from Merkle White list for each new asset
  * @param _cotraderGlobalConfig         Address of CoTrader global config
  */
  constructor(
    address _owner,
    string memory _name,
    uint256 _successFee,
    address _exchangePortalAddress,
    address _permittedAddresses,
    address _fundValueOracle,
    bool    _isRequireTradeVerification,
    address _cotraderGlobalConfig
  )
  SmartFundLightCore(
    _owner,
    _name,
    _successFee,
    _exchangePortalAddress,
    _permittedAddresses,
    address(0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee),
    _fundValueOracle,
    _isRequireTradeVerification,
    _cotraderGlobalConfig
  )
  public{}

  /**
  * @dev Deposits ether into the fund and allocates a number of shares to the sender
  * depending on the current number of shares, the funds value, and amount deposited
  *
  * @return The amount of shares allocated to the depositor
  */
  function deposit() external verifyOracleSender payable returns (uint256) {
    // Check if the sender is allowed to deposit into the fund
    if (onlyWhitelist)
      require(whitelist[msg.sender]);

    // Require that the amount sent is not 0
    require(msg.value != 0, "ZERO_DEPOSIT");

    // Calculate number of shares
    uint256 shares = calculateDepositToShares(msg.value);

    totalWeiDeposited += msg.value;

    // reset latest Oracle Caller for protect from double call
    latestOracleCaller = address(0);

    // If user would receive 0 shares, don't continue with deposit
    require(shares != 0, "ZERO_SHARES");

    // Add shares to total
    totalShares = totalShares.add(shares);

    // Add shares to address
    addressToShares[msg.sender] = addressToShares[msg.sender].add(shares);

    addressesNetDeposit[msg.sender] += int256(msg.value);

    emit Deposit(msg.sender, msg.value, shares, totalShares);

    return shares;
  }
}
