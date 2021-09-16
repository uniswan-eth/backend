import { HttpClient } from "@0x/connect";
import { assetDataUtils } from "@0x/order-utils";
import { BigNumber } from "@0x/utils";

const DB_BASE_URL = "https://uns-backend.vercel.app/api/v3";
const MAX_ORDERS = 10;

var possibleFinalPools = new Set();

// Simulate executing a swap order
function executeOrder(ourAssetsEncoded, order) {
    const takerAssets = assetDataUtils.decodeAssetDataOrThrow(
        order.takerAssetData
    );

    const ourAssets = assetDataUtils.decodeAssetDataOrThrow(
        ourAssetsEncoded
    );

    for (let i = 0; i < takerAssets.nestedAssetData.length; i++) {
        const index = ourAssets.nestedAssetData.indexOf(takerAssets.nestedAssetData[i]);
        if (index > -1) {
            ourAssets.amounts[index] = ourAssets.amounts[index].minus(takerAssets.amounts[i]);
            if (ourAssets.amounts[index].toNumber() < 0) {
                return null;
            }
        } else {
            return null;
        }
    }

    const makerAssets = assetDataUtils.decodeAssetDataOrThrow(
        order.makerAssetData
    );

    for (let i = 0; i < makerAssets.nestedAssetData.length; i++) {
        var index = ourAssets.nestedAssetData.indexOf(makerAssets.nestedAssetData[i]);
        if (index === -1) {
            index = ourAssets.nestedAssetData.length;
            ourAssets.nestedAssetData.push(makerAssets.nestedAssetData[i]);
            ourAssets.amounts.push(new BigNumber(0));
        }
        ourAssets.amounts[index] = ourAssets.amounts[index].plus(makerAssets.amounts[i]);
    }

    const newOurAssetsEncoded = assetDataUtils.encodeMultiAssetData(
        ourAssets.amounts,
        ourAssets.nestedAssetData
    );

    return newOurAssetsEncoded;
}

// "With my `ourAssetsEncoded` of assets, and an orderbook of `orders`, what are all the possible asset bundles I can end up with?"
function findPossibleAssets(ourAssetsEncoded, orders, executedOrders) {
    var options = []

    for (let i = 0; i < orders.length; i++) {
        const newOurAssetsEncoded = executeOrder(ourAssetsEncoded, orders[i]);

        if (newOurAssetsEncoded) {
            if (!possibleFinalPools.has(newOurAssetsEncoded)) {
                possibleFinalPools.add(newOurAssetsEncoded);

                const newExecutedOrders = [...executedOrders, orders[i]]
                options.push(newExecutedOrders);

                const ordersNew = orders.slice();
                ordersNew.splice(i, 1);

                if (newExecutedOrders.length < MAX_ORDERS) options.push(...findPossibleAssets(newOurAssetsEncoded, ordersNew, newExecutedOrders));
            }
        }
    }

    return options;
}

export default async (req, res) => {
    const { assetData } = req.query;

    possibleFinalPools = new Set();
    possibleFinalPools.add(assetData);

    const orderClient = new HttpClient(DB_BASE_URL);
    const json = await orderClient.getOrdersAsync();
    const orders = json.records.map((r) => r.order);

    const options = findPossibleAssets(assetData, orders, [])

    res.json(options);
};
