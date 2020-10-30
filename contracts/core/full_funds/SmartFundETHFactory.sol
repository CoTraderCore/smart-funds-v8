pragma solidity ^0.6.12;

import "./SmartFundETH.sol";

contract SmartFundETHFactory {
  function createSmartFund(
    address _owner,
    string  memory _name,
    uint256 _successFee,
    address _exchangePortalAddress,
    address _poolPortalAddress,
    address _defiPortal,
    address _permittedAddresses,
    address _fundValueOracle,
    bool    _isRequireTradeVerification,
    address _cotraderGlobalConfig
  )
  public
  returns(address)
  {
    SmartFundETH smartFundETH = new SmartFundETH(
      _owner,
      _name,
      _successFee,
      _exchangePortalAddress,
      _poolPortalAddress,
      _defiPortal,
      _permittedAddresses,
      _fundValueOracle,
      _isRequireTradeVerification,
      _cotraderGlobalConfig
    );

    return address(smartFundETH);
  }
}
