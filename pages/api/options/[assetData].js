import { connectToDatabase } from "../../../lib/mongodb";
import { assetDataUtils } from "@0x/order-utils";

var gotIts = [];

function buildSwapChain(chain, signedOrders) {
    var toReturn = []
    for (let i = 0; i < signedOrders.length; i++) {
        if (
            bundleCanFillOrder(signedOrders[i], chain[chain.length - 1].order.makerAssetData) && !gotIts.includes(signedOrders[i].order.makerAssetData)
        ) {
            gotIts.push(signedOrders[i].order.makerAssetData)
            const newChain = [...chain, signedOrders[i]]
            toReturn.push(newChain);
            if (newChain.length < 5) toReturn = toReturn.concat(buildSwapChain(newChain, signedOrders));
        }
    }
    return toReturn;
}

function bundleCanFillOrder(signedOrder, assetData) {
    var inter = assetDataUtils.decodeMultiAssetData(
        signedOrder.order.takerAssetData
    );

    var hi = assetDataUtils.decodeMultiAssetData(
        assetData
    );

    console.log(hi.nestedAssetData)
    console.log(inter.nestedAssetData)
    console.log("_________________")
    for (let j = 0; j < inter.nestedAssetData.length; j++) {
        if (!hi.nestedAssetData.includes(inter.nestedAssetData[j]))
            return false;
    }
    return true;
}

export default async (req, res) => {
    const { db } = await connectToDatabase();
    const { assetData } = req.query;

    const signedOrders = await db
        .collection("orders")
        .find({})
        .toArray();

    gotIts = [assetData];
    var options = []
    for (let i = 0; i < signedOrders.length; i++) {
        if (bundleCanFillOrder(signedOrders[i], assetData)) {
            options.push([signedOrders[i]]);

            gotIts.push(signedOrders[i].order.makerAssetData)

            options = options.concat(buildSwapChain([signedOrders[i]], signedOrders));
        }
    }

    res.json(options);
};
