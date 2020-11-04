pragma solidity ^0.6.12;

import "../../contracts/zeppelin-solidity/contracts/token/ERC20/IERC20.sol";

// Mock Oracle
contract FundValueOracle {
  uint256 public value;
  address public chainLinkAddress;

  // Mapping of requestId => FundValue
  mapping (bytes32 => uint256) public getFundValueByID;

  constructor(address _chainLinkAddress) public {
    chainLinkAddress = _chainLinkAddress;
  }

  function requestValue(address _fundAddress, uint256 _fee) public returns (bytes32 requestId)
  {
     // transfer link commision from sender
     require(IERC20(chainLinkAddress).transferFrom(
       msg.sender,
       address(this),
       _fee
      ));

      requestId = bytes32(uint256(1));
      getFundValueByID[requestId] = value;
  }

  function setMockValue(uint256 _value) public {
    value = _value;
  }
}
