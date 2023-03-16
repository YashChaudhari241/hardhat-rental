const { ethers, getNamedAccounts } = require("hardhat")

async function main() {
    const { deployer } = await getNamedAccounts()
    console.log(deployer)
    const housingRental = await ethers.getContract("HousingRental", deployer)
    console.log(`Got contract Rental at ${housingRental.address}`)
    const transactionResponse = await housingRental.createListing({
        index: 0,
        metadataID: "238",
        metadataHash: "has456456h",
        landlord: deployer,
    })
    console.log(transactionResponse)
    await transactionResponse.wait(1)
    console.log("done!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
