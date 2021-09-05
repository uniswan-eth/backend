import { connectToDatabase } from "../../../lib/mongodb";

function buildSwapChain(chain, orders) {
    var toReturn = []
    for (let i = 0; i < orders.length; i++) {
        if (
            orders[i].order.takerAssetData ===
            chain[chain.length - 1].order.makerAssetData
        ) {
            const newChain = [...chain, orders[i]]
            toReturn.push(newChain);
            if (newChain.length < 3) toReturn = toReturn.concat(buildSwapChain(newChain, orders));
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

    var options = []
    for (let i = 0; i < orders.length; i++) {
        if (orders[i].order.takerAssetData === assetData) {
            options.push([orders[i]]);

            options = options.concat(buildSwapChain([orders[i]], orders));
        }
    }

    res.json(options);
};
