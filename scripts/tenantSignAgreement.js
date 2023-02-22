const { ethers, getNamedAccounts } = require("hardhat")

async function main() {
    const { tenant } = await getNamedAccounts()
    // console.log(deployer)
    const housingRental = await ethers.getContract("HousingRental", tenant)
    console.log(`Got contract Rental at ${housingRental.address}`)
    try {
        const transactionResponse = await housingRental.signAgreement(
            (listingIndex = 0),
            (senderSign = "tenantSign"),
            { value: ethers.utils.parseEther("0.5") }
        )
        await transactionResponse.wait(1)
    } catch (error) {
        console.log(error)
        console.log(error.reason)
    }
    console.log("done!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
