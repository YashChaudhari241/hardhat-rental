const { ethers, getNamedAccounts } = require("hardhat")

async function main() {
    const { deployer } = await getNamedAccounts()
    const housingRental = await ethers.getContract("HousingRental", deployer)
    console.log(`Got contract Rental at ${housingRental.address}`)
    const transactionResponse = await housingRental.createListing({
        newListing: {
            id: 0,
            landlord: deployer,
            deposit: 5,
            rent: 1,
            months: 48,
            isRentEth: true,
            metadataID: "test",
            metadataHash: "hash",
        },
    })
    await transactionResponse.wait()
    console.log("done!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
