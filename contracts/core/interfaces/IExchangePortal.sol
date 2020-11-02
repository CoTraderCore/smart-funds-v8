import "../../zeppelin-solidity/contracts/token/ERC20/IERC20.sol";

// interface for fund contract
interface IExchangePortal {
  function trade(
    IERC20 _source,
    uint256 _sourceAmount,
    IERC20 _destination,
    uint256 _type,
    bytes32[] calldata _proof,
    uint256[] calldata _positions,
    bytes calldata _additionalData,
    bool _verifyDestanation
  )
    external
    payable
    returns (uint256);
}
