require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.28",
  networks: {
    // Add this section if missing
    ganache: {
      url: "http://127.0.0.1:8545", // Ganache default RPC URL
      chainId: 1337, // Standard for local development
    }
  }
};