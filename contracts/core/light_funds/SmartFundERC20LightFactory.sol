pragma solidity ^0.6.12;

import "./SmartFundERC20Light.sol";

contract SmartFundERC20LightFactory {
  function createSmartFundLight(
    address _owner,
    string memory _name,
    uint256 _successFee,
    address _exchangePortalAddress,
    address _permittedAddresses,
    address _coinAddress,
    address _fundValueOracle,
    bool    _isRequireTradeVerification,
    address _cotraderGlobalConfig
  )
  public
  returns(address)
  {
    SmartFundERC20Light smartFundERC20Light = new SmartFundERC20Light(
      _owner,
      _name,
      _successFee,
      _exchangePortalAddress,
      _permittedAddresses,
      _coinAddress,
      _fundValueOracle,
      _isRequireTradeVerification,
      _cotraderGlobalConfig
    );

    return address(smartFundERC20Light);
  }
}
