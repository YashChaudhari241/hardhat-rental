const { ethers, getNamedAccounts } = require("hardhat")

async function main() {
    const { deployer } = await getNamedAccounts()
    const housingRental = await ethers.getContract("HousingRental", deployer)
    console.log(`Got contract Rental at ${housingRental.address}`)
    const transactionResponse = await housingRental.rentalData("0")
    console.log(transactionResponse)
    console.log("done!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
