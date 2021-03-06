pragma solidity ^0.6.12;

import "./SmartFundERC20.sol";

contract SmartFundERC20Factory {
  function createSmartFund(
    address _owner,
    string memory _name,
    uint256 _successFee,
    address _exchangePortalAddress,
    address _poolPortalAddress,
    address _defiPortal,
    address _permittedAddresses,
    address _coinAddress,
    address _fundValueOracle,
    bool    _isRequireTradeVerification,
    address _cotraderGlobalConfig
  )
  public
  returns(address)
  {
    SmartFundERC20 smartFundERC20 = new SmartFundERC20(
      _owner,
      _name,
      _successFee,
      _exchangePortalAddress,
      _poolPortalAddress,
      _defiPortal,
      _permittedAddresses,
      _coinAddress,
      _fundValueOracle,
      _isRequireTradeVerification,
      _cotraderGlobalConfig
    );

    return address(smartFundERC20);
  }
}
