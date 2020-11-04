interface IFundValueOracle {
  function requestValue(address _fundAddress, uint256 _fee) external payable returns (bytes32 requestId);
  function getFundValueByID(bytes32 _requestId) external view returns(uint256 value);
  function fee() external returns(uint256);
}
