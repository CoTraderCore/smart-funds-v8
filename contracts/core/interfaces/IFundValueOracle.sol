interface IFundValueOracle {
  function FundDataMap(bytes32 _requestId) external returns(uint256 value, uint256 requestTime);
}
