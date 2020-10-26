pragma solidity ^0.6.12;

import "./SmartFundLightCore.sol";
import "../interfaces/PermittedAddressesInterface.sol";


/*
  Note: this smart fund smart fund inherits SmartFundLightCore and make core operations like deposit,
  calculate fund value etc in ERC20
*/
contract SmartFundERC20Light is SmartFundLightCore {
  using SafeMath for uint256;
  using SafeERC20 for IERC20;

  // State for recognize if this fund stable asset based
  bool public isStableCoinBasedFund;

  /**
  * @dev constructor
  *
  * @param _owner                        Address of the fund manager
  * @param _name                         Name of the fund, required for DetailedERC20 compliance
  * @param _successFee                   Percentage of profit that the fund manager receives
  * @param _platformAddress              Address of platform to send fees to
  * @param _exchangePortalAddress        Address of initial exchange portal
  * @param _permittedAddresses           Address of permittedAddresses contract
  * @param _fundValueOracle              Address of Oracle contract
  * @param _isRequireTradeVerification   If true fund will require verification from Merkle White list for each new asset
  */
  constructor(
    address _owner,
    string memory _name,
    uint256 _successFee,
    address _platformAddress,
    address _exchangePortalAddress,
    address _permittedAddresses,
    address _coinAddress,
    address _fundValueOracle,
    bool    _isRequireTradeVerification
  )
  SmartFundLightCore(
    _owner,
    _name,
    _successFee,
    _platformAddress,
    _exchangePortalAddress,
    _permittedAddresses,
    _coinAddress,
    _fundValueOracle,
    _isRequireTradeVerification
  )
  public {
    // Initial stable coint permitted interface
    permittedAddresses = PermittedAddressesInterface(_permittedAddresses);
    // Push coin in tokens list
    _addToken(_coinAddress);
    // Define is stable based fund
    isStableCoinBasedFund = permittedAddresses.isMatchTypes(_coinAddress, 4);
  }

  /**
  * @dev Deposits core coin into the fund and allocates a number of shares to the sender
  * depending on the current number of shares, the funds value, and amount deposited
  *
  * @return The amount of shares allocated to the depositor
  */
  function deposit(uint256 depositAmount) external verifyOracleSender returns (uint256) {
    // Check if the sender is allowed to deposit into the fund
    if (onlyWhitelist)
      require(whitelist[msg.sender]);

    // Require that the amount sent is not 0
    require(depositAmount > 0, "ZERO_DEPOSIT");

    // Transfer core ERC20 coin from sender
    require(IERC20(coreFundAsset).transferFrom(msg.sender, address(this), depositAmount),
    "TRANSFER_FROM_ISSUE");

    totalWeiDeposited += depositAmount;

    // Calculate number of shares
    uint256 shares = calculateDepositToShares(depositAmount);

    // reset latest Oracle Caller for protect from double call
    latestOracleCaller = address(0);

    // If user would receive 0 shares, don't continue with deposit
    require(shares != 0, "ZERO_SHARES");

    // Add shares to total
    totalShares = totalShares.add(shares);

    // Add shares to address
    addressToShares[msg.sender] = addressToShares[msg.sender].add(shares);

    addressesNetDeposit[msg.sender] += int256(depositAmount);

    emit Deposit(msg.sender, depositAmount, shares, totalShares);

    return shares;
  }

  /**
  * @dev sets new coreFundAsset NOTE: this works only for stable coins
  *
  * @param _coinAddress    New stable address
  */
  function changeStableCoinAddress(address _coinAddress) external onlyOwner {
    require(isStableCoinBasedFund, "NOT_USD_FUND");
    require(totalWeiDeposited == 0, "NOT_EMPTY_DEPOSIT");
    require(permittedAddresses.isMatchTypes(_coinAddress, 4), "WRONG_ADDRESS");

    coreFundAsset = _coinAddress;
  }
}
