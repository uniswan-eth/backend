import { connectToDatabase } from "../../../lib/mongodb";

var gotIts = [];

function buildSwapChain(chain, orders) {
    var toReturn = []
    for (let i = 0; i < orders.length; i++) {
        if (
            orders[i].order.takerAssetData ===
            chain[chain.length - 1].order.makerAssetData
            && !gotIts.includes(orders[i].order.makerAssetData)
        ) {
            gotIts.push(orders[i].order.makerAssetData)
            const newChain = [...chain, orders[i]]
            toReturn.push(newChain);
            if (newChain.length < 5) toReturn = toReturn.concat(buildSwapChain(newChain, orders));
        }
    }
    return toReturn;
}

export default async (req, res) => {
    const { db } = await connectToDatabase();
    const { assetData } = req.query;

    const orders = await db
        .collection("orders")
        .find({})
        .toArray();

    gotIts = [assetData];

    var options = []
    for (let i = 0; i < orders.length; i++) {
        if (orders[i].order.takerAssetData === assetData) {
            options.push([orders[i]]);

            gotIts.push(orders[i].order.makerAssetData)

            options = options.concat(buildSwapChain([orders[i]], orders));
        }
    }

    res.json(options);
};
