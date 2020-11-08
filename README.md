# smart-funds-v8

```
Updates

Calculate fund value via Oracle for take nto account CEXs prices, not on;y DEXs.
```


```
Run test
0) npm i
1) npm run ganache  
2) truffle test

if not work due JS memory issue try this command instead truffle test

sudo node --max-old-space-size=4096 /usr/local/bin/truffle test

```


```
ETH Full factory

0xF7861a665F5a1f10052Dd12370dBA653A521aa5f

https://etherscan.io/tx/0x3b211d290c83892e1df97c8b94166e366b85e53046ec513d791fb8ddba5f6d59


ERC20 Full factory

0x81471DBB5317f84C5605522e4dF07B2c00B8027E

https://etherscan.io/tx/0x2ac6eb2f3135cc831b44e56aac501631d778bb69a9be6e56d3265ea8463dee57


ETH Light factory

0xC23427e8eEb622efDc1347fe77F5F72ff0E3cF66

https://etherscan.io/tx/0x4cf345d2ae5b2b71e2579208587b99ca486591d800c846b4e95f92b66fa2cbe8


ERC20 Light factory

0x3ffa0CbFEf7E3a0112CCf7333193ac849248F375

https://etherscan.io/tx/0x065c6a695f93c11c2a81db420c3f65a465bb5220f682c57e0ab47422878d0d83


CoTrader Global Config

0x9c990064EC31a531752adD55283B560Fb191dE2B

https://etherscan.io/tx/0xb0d6b7dc5800ab01f9140e2c6c78a92ff0984739662c30422436a6d5c7792e84


Oracle

0x3ebe7aaa7192a582a0ba1cdd5c3d9cfb73055f7c

https://etherscan.io/tx/0xf1a94d7f854c6adbdade124204e13928be3b585f466a51a1f2af8556a6811360


```

```
Deploy Notes

1) Don't forget set api endpoint in fund value Oracle contract
2) Fund value Oracle contract is number 5 in permitted address
```


```
DEV Notes
1) calculateDepositToShares not the same as in previous versions fund
we not sub msg.value, because via Oracle we can't take into account msg.value in total fund value

2) change order in deposit

from this
totalWeiDeposited += msg.value;
uint256 shares = calculateDepositToShares(msg.value);

to this
uint256 shares = calculateDepositToShares(msg.value);
totalWeiDeposited += msg.value;

because via Oracle we can't take into account msg.value in total fund value

```


```
Removed methods

calculateFundProfit

calculateAddressValue

calculateAddressProfit

getFundTokenHolding
```
