interface DefiPortalViewInterface {
  function getValue(
    address _from,
    address _to,
    uint256 _amount
  )
   external
   view
   returns(uint256);
}
