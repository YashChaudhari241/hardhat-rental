const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
// const { verify } = require("../utils/verify")
require("dotenv").config()
const fs = require("fs")
module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    log("----------------------------------------------------")
    log("Deploying HousingRental and waiting for confirmations...")
    const housingRental = await deploy("HousingRental", {
        from: deployer,
        args: [deployer],
        log: true,
        // we need to wait if on a live network so we can verify properly
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    log(`HousingRental deployed at ${housingRental.address}`)
    json = JSON.stringify({ deployed_at: housingRental.address })
    fs.writeFile("../housing_rental_dapp/hardhat.json", json, "utf8", function () {
        log("wrote config")
    })
    // if (
    //     !developmentChains.includes(network.name) &&
    //     process.env.ETHERSCAN_API_KEY
    // ) {
    //     await verify(fundMe.address, [ethUsdPriceFeedAddress])
    // }
}

module.exports.tags = ["all", "rental"]
