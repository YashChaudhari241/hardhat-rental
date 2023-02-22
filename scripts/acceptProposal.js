const { ethers, getNamedAccounts } = require("hardhat")

async function main() {
    const { deployer, middlemanAcc } = await getNamedAccounts()
    console.log(deployer)
    const housingRental = await ethers.getContract("HousingRental", deployer)
    console.log(`Got contract Rental at ${housingRental.address}`)
    try {
        const transactionResponse = await housingRental.acceptProposal(
            (listingIndex = 0),
            (index = 1),
            (docID = "23123"),
            (docHash = "9r802j3"),
            (middleman = middlemanAcc),
            (startDate = parseInt(Date.now() / 1000).toString()),
            (months = 12),
            (rent = ethers.utils.parseEther("0.1")),
            (deposit = ethers.utils.parseEther("0.5")),
            (landlordSign = "testSign")
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
