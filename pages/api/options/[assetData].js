import { connectToDatabase } from "../../../lib/mongodb";
import { assetDataUtils } from "@0x/order-utils";

const MAX_CHAIN_LENGTH = 6;

function buildSwapChain(chain, signedOrders) {
    var options = []
    for (let i = 0; i < signedOrders.length; i++) {
        if (
            bundleCanFillOrder(signedOrders[i], chain[chain.length - 1].order.makerAssetData)
        ) {
            const newChain = [...chain, signedOrders[i]]
            options.push(newChain);

            // This order has been executed, so remove it from the list.
            const signedOrdersNew = signedOrders.slice();
            signedOrdersNew.splice(i, 1);

            if (newChain.length < MAX_CHAIN_LENGTH) options = options.concat(buildSwapChain(newChain, signedOrdersNew));
        }
    }
    return options;
}

function bundleCanFillOrder(signedOrder, assetData) {
    var inter = assetDataUtils.decodeMultiAssetData(
        signedOrder.order.takerAssetData
    );

    var bundleEncoded = assetDataUtils.decodeMultiAssetData(
        assetData
    );

    for (let j = 0; j < inter.nestedAssetData.length; j++) {
        if (!bundleEncoded.nestedAssetData.includes(inter.nestedAssetData[j]))
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

    var options = []
    var chain = []
    for (let i = 0; i < signedOrders.length; i++) {
        if (bundleCanFillOrder(signedOrders[i], assetData)) {
            const newChain = [...chain, signedOrders[i]]
            options.push(newChain);

            // This order has been executed, so remove it from the list.
            const signedOrdersNew = signedOrders.slice();
            signedOrdersNew.splice(i, 1);

            if (newChain.length < MAX_CHAIN_LENGTH) options = options.concat(buildSwapChain(newChain, signedOrdersNew));
        }
    }

    res.json(options);
};
