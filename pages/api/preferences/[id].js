import { connectToDatabase } from "../../../lib/mongodb";
export default async (req, res) => {
    const { db } = await connectToDatabase();
    const { id } = req.query;
    const preferences = await db
        .collection("preferences")
        .find({ _id: id })
        .toArray();
    res.json(preferences[0]);
};