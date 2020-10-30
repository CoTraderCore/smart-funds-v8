pragma solidity ^0.6.12;

import "../../zeppelin-solidity/contracts/access/Ownable.sol";

contract CoTraderGlobalConfig is Ownable {
  // trade freeze
  uint256 public MIN_TRADE_FREEZE = 3 minutes;
  uint256 public MAX_TRADE_FREEZE = 15 minutes;

  // open next deposit/withdarw
  uint256 public MIN_DW_INTERVAL = 30 minutes;
  uint256 public MAX_DW_INTERVAL = 2 hours;

  // max tokens
  uint256 public MIN_MAX_TOKENS = 20;
  uint256 public MAX_MAX_TOKENS = 40;

  // address of CoTrader platform commision
  address public PLATFORM_ADDRESS;

  constructor(address _PLATFORM_ADDRESS) public{
    PLATFORM_ADDRESS = _PLATFORM_ADDRESS;
  }

  function set_PLATFORM_ADDRESS(address _PLATFORM_ADDRESS) external onlyOwner {
    PLATFORM_ADDRESS = _PLATFORM_ADDRESS;
  }


  function set_MIN_TRADE_FREEZE(uint256 _value) external onlyOwner {
    MIN_TRADE_FREEZE = _value;
  }

  function set_MAX_TRADE_FREEZE(uint256 _value) external onlyOwner {
    MAX_TRADE_FREEZE = _value;
  }

  function set_MIN_DW_INTERVAL(uint256 _value) external onlyOwner {
    MIN_DW_INTERVAL = _value;
  }

  function set_MAX_DW_INTERVAL(uint256 _value) external onlyOwner {
    MAX_DW_INTERVAL = _value;
  }

  function set_MIN_MAX_TOKENS(uint256 _value) external onlyOwner {
    MIN_MAX_TOKENS = _value;
  }

  function set_MAX_MAX_TOKENS(uint256 _value) external onlyOwner {
    MAX_MAX_TOKENS = _value;
  }
}
