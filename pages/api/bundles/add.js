import { connectToDatabase } from "../../../lib/mongodb";
export default async (req, res) => {
    const { db } = await connectToDatabase();
    const { id } = req.query;
    const bundles = await db
        .collection("bundles")
        .find({ _id: id })
        .toArray();
    res.json(bundles[0]);
};