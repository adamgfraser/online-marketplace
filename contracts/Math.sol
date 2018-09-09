pragma solidity ^0.4.24;

/// @title Safe Math
/// @author Adam Fraser
library Math {

    /// @notice Multiplies two integers, checking for underflow.
    /// @param self The first integer.
    /// @param other The second integer.
    /// @return The product.
    function times(uint self, uint other) public pure returns (uint product) {
        if (self == 0) {
            product = 0;
        } else {
            product = self * other;
            require(product / self == other, "Integer overflow.");
        }
    }      
}
