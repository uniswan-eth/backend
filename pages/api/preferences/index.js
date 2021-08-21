import { connectToDatabase } from "../../../lib/mongodb";
export default async (req, res) => {
    const { db } = await connectToDatabase();
    const preferences = await db
        .collection("preferences")
        .find({})
        .toArray();
    res.json(preferences);
};