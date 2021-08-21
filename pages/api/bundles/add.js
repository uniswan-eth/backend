import { connectToDatabase } from "../../../lib/mongodb";
export default async (req, res) => {
    const { db } = await connectToDatabase();
    const body = JSON.parse(req.body)
    await db
        .collection("bundles")
        .insertOne(body)
};