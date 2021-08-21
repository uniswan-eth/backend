import { connectToDatabase } from "../../../lib/mongodb";
export default async (req, res) => {
    const { db } = await connectToDatabase();
    await db
        .collection("bundles")
        .insertOne({
            "_id": "0x42856dfcc13c575e1fa5792bed13541b47e3e38ab8d2d7601925b9099f712e38",
            "bundle": [
                {
                    "collectionAddress": "0x36a8377e2bb3ec7d6b0f1675e243e542eb6a4764",
                    "tokenId": "1"
                }
            ]
        })
};