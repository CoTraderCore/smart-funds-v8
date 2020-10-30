interface ICoTraderGlobalConfig {
  function MIN_TRADE_FREEZE() external view returns(uint256);
  function MAX_TRADE_FREEZE() external view returns(uint256);

  function MIN_DW_INTERVAL() external view returns(uint256);
  function MAX_DW_INTERVAL() external view returns(uint256);

  function MIN_MAX_TOKENS() external view returns(uint256);
  function MAX_MAX_TOKENS() external view returns(uint256);

  function PLATFORM_ADDRESS() external view returns(address);
}
