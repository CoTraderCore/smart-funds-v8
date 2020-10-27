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
