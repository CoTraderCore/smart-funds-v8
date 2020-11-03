interface ICoTraderGlobalConfig {
  function MAX_TOKENS() external view returns(uint256);

  function TRADE_FREEZE_TIME() external view returns(uint256);

  function DW_FREEZE_TIME() external view returns(uint256);

  function PLATFORM_ADDRESS() external view returns(address);
}
