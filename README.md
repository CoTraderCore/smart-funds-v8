# smart-funds-v8

```
TODO
1) Get best price from Oracle for fund value
2) Freeze for 2-3 minutes deposit, trade, withdraw until user do deposit or withdraw
3) Allow do new deposit or withdraw request after each new 10 blocks
4) Change Oracle portal
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
```

```
Deploy Notes

1) don't forget set api endpoint in fund value Oracle
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
