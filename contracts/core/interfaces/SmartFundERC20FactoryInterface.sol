interface SmartFundERC20FactoryInterface {
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
  external
  returns(address);
}
