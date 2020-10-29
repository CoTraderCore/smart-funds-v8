pragma solidity ^0.6.12;

import "../../zeppelin-solidity/contracts/access/Ownable.sol";

contract CoTraderGlobalConfig {
  // trade freeze
  uint256 public MIN_TRADE_FREEZE = 3 minutes;
  uint256 public MAX_TRADE_FREEZE = 10 minutes;

  // open next deposit/withdarw
  uint256 public MIN_DW_INTERVAL = 30 minutes;
  uint256 public MAX_DW_INTERVAL = 2 hours;

  // max tokens
  uint256 public MIN_MAX_TOKENS = 20;
  uint256 public MAX_MAX_TOKENS = 50;


  function set_MIN_TRADE_FREEZE(uint256 _value) public onlyOwner {
    MIN_TRADE_FREEZE = _value;
  }

  function set_MAX_TRADE_FREEZE(uint256 _value) public onlyOwner {
    MAX_TRADE_FREEZE = _value;
  }

  function set_MIN_DW_INTERVAL(uint256 _value) public onlyOwner {
    MIN_DW_INTERVAL = _value;
  }

  function set_MAX_DW_INTERVAL(uint256 _value) public onlyOwner {
    MAX_DW_INTERVAL = _value;
  }

  function set_MIN_MAX_TOKENS(uint256 _value) public onlyOwner {
    MIN_MAX_TOKENS = _value;
  }

  function set_MAX_MAX_TOKENS(uint256 _value) public onlyOwner {
    MAX_MAX_TOKENS = _value;
  }
}