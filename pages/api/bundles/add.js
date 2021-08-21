import { connectToDatabase } from "../../../lib/mongodb";
export default async (req, res) => {
    const { db } = await connectToDatabase();
    const bundles = await db
        .collection("bundles")
        .insertOne({
            "_id": "hs",
            "bundle": [
                {
                    "collectionAddress": "t",
                    "tokenId": "1"
                }
            ]
        })
    res.json(bundles[0]);
};