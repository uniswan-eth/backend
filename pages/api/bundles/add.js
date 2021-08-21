import { connectToDatabase } from "../../../lib/mongodb";
export default async (req, res) => {
    const { db } = await connectToDatabase();
    const body = req.body;
    const bundles = await db
        .collection("bundles")
        .insertOne(body)
    res.json(bundles[0]);
};