import { connectToDatabase } from "../../../lib/mongodb";
export default async (req, res) => {
    const { db } = await connectToDatabase();
    const bundles = await db
        .collection("bundles")
        .find({})
        .toArray();
    res.json(bundles);
};