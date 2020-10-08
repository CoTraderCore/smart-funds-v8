interface IFundValueOracle {
  function requestValue(address _fundAddress) external returns (bytes32 requestId);
  function getFundValueByID(bytes32 _requestId) external returns(uint256 value);
  function fee() external returns(uint256);
}
