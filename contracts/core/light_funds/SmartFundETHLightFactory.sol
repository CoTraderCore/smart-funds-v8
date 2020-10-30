pragma solidity ^0.6.12;

import "./SmartFundETHLight.sol";

contract SmartFundETHLightFactory {
  function createSmartFundLight(
    address _owner,
    string  memory _name,
    uint256 _successFee,
    address _exchangePortalAddress,
    address _permittedAddresses,
    address _fundValueOracle,
    bool    _isRequireTradeVerification,
    address _cotraderGlobalConfig
  )
  public
  returns(address)
  {
    SmartFundETHLight smartFundETHLight = new SmartFundETHLight(
      _owner,
      _name,
      _successFee,
      _exchangePortalAddress,
      _permittedAddresses,
      _fundValueOracle,
      _isRequireTradeVerification,
      _cotraderGlobalConfig
    );

    return address(smartFundETHLight);
  }
}
