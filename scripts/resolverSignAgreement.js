const { ethers, getNamedAccounts } = require("hardhat")

async function main() {
    const { middlemanAcc } = await getNamedAccounts()
    // console.log(deployer)
    const housingRental = await ethers.getContract("HousingRental", middlemanAcc)
    console.log(`Got contract Rental at ${housingRental.address}`)
    const transactionResponse = await housingRental.signAgreement(
        (listingIndex = 0),
        (senderSign = "resolverSign")
    )
    await transactionResponse.wait(1)
    console.log("done!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
