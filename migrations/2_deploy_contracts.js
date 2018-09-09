var Market = artifacts.require("Market");
var Math = artifacts.require("Math");

module.exports = function(deployer) {
  deployer.deploy(Math);
  deployer.link(Math, Market);
  deployer.deploy(Market);
};
