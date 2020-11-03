pragma solidity ^0.6.12;

import "../../zeppelin-solidity/contracts/access/Ownable.sol";

contract CoTraderGlobalConfig is Ownable {
  // trade freeze
  uint256 public DW_FREEZE_TIME = 30 minutes;

  // open next deposit/withdarw
  uint256 public TRADE_FREEZE_TIME = 5 minutes;

  // max tokens
  uint256 public MAX_TOKENS = 30;

  // address of CoTrader platform commision
  address public PLATFORM_ADDRESS;

  constructor(address _PLATFORM_ADDRESS) public{
    PLATFORM_ADDRESS = _PLATFORM_ADDRESS;
  }

  function set_PLATFORM_ADDRESS(address _PLATFORM_ADDRESS) external onlyOwner {
    PLATFORM_ADDRESS = _PLATFORM_ADDRESS;
  }


  function set_DW_FREEZE_TIME(uint256 _value) external onlyOwner {
    DW_FREEZE_TIME = _value;
  }

  function set_TRADE_FREEZE_TIME(uint256 _value) external onlyOwner {
    TRADE_FREEZE_TIME = _value;
  }

  function set_MAX_TOKENS(uint256 _value) external onlyOwner {
    MAX_TOKENS = _value;
  }
}
