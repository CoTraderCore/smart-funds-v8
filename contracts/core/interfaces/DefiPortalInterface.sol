interface DefiPortalInterface {
  function callPayableProtocol(
    address[] memory tokensToSend,
    uint256[] memory amountsToSend,
    bytes calldata _additionalData,
    bytes32[] calldata _additionalArgs
  )
    external
    payable
    returns(
      string memory eventType,
      address[] memory tokensToReceive,
      uint256[] memory amountsToReceive
    );

  function callNonPayableProtocol(
    address[] memory tokensToSend,
    uint256[] memory amountsToSend,
    bytes calldata _additionalData,
    bytes32[] calldata _additionalArgs
  )
    external
    returns(
      string memory eventType,
      address[] memory tokensToReceive,
      uint256[] memory amountsToReceive
    );
}
