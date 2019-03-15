pragma solidity 0.5.3;

import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract Airdrop is Ownable {

  ERC20 public token = ERC20(0x5dE805154A24Cb824Ea70F9025527f35FaCD73a1); // EVOAI token contract address

  /**
   * @dev makeAirdrop to address
   * @param _addresses address[] addresses to airdrop
   * @param _values address[] values for each address
   */
  function doAirdrop(address[] memory _addresses, uint256 [] memory _values) public onlyOwner returns (uint256) {
    uint256 i = 0;

    while (i < _addresses.length) {
      token.transferFrom(msg.sender, _addresses[i], _values[i] * (10 ** 18));
      i += 1;
    }

    return(i);
  }

}
