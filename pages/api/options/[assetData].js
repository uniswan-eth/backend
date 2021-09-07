import { connectToDatabase } from "../../../lib/mongodb";
import { assetDataUtils } from "@0x/order-utils";

const MAX_ORDERS = 6;

// "With a given `bundle` of assets, and an orderbook of `signedOrders`, what are all the possible assets I can end up with?"
function stateTransition(startingAssetData, signedOrders, executedSignedOrders) {
    var options = []
    for (let i = 0; i < signedOrders.length; i++) {
        const orderDecoded = assetDataUtils.decodeMultiAssetData(
            signedOrders[i].order.takerAssetData
        );

        const startingDecoded = assetDataUtils.decodeMultiAssetData(
            startingAssetData
        );

        // Loop through all the assets wished for by the offer, and remove them from our asset pool
        var orderFillable = true;
        for (let j = 0; j < orderDecoded.nestedAssetData.length; j++) {
            const index = startingDecoded.nestedAssetData.indexOf(orderDecoded.nestedAssetData[j]);
            if (index > -1) {
                startingDecoded.nestedAssetData.splice(index, 1);
                startingDecoded.amounts.splice(index, 1)
            } else {
                // If we can't satisfy the order, break
                orderFillable = false;
                break;
            }
        }

        if (orderFillable) {
            const newBundleEncoded = assetDataUtils.encodeMultiAssetData(
                startingDecoded.amounts,
                startingDecoded.nestedAssetData
            );

            const newExecutedSignedOrders = [...executedSignedOrders, signedOrders[i]]
            options.push(newExecutedSignedOrders);

            const signedOrdersNew = signedOrders.slice();
            signedOrdersNew.splice(i, 1);

            if (newExecutedSignedOrders.length < MAX_ORDERS) options = options.concat(stateTransition(newBundleEncoded, signedOrdersNew, newExecutedSignedOrders));
        }
    }
    return options;
}

export default async (req, res) => {
    const { db } = await connectToDatabase();
    const { assetData } = req.query;

    const signedOrders = await db
        .collection("orders")
        .find({})
        .toArray();

    var options = stateTransition(assetData, signedOrders, [])

    res.json(options);
};
