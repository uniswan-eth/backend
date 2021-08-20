import { Schema, model } from 'mongoose';

const Bundle = new Schema({
    _id: {
        type: String,
        unique: true
    },
    bundle: {
        type: Array,
    },
});

export default model('Bundle', Bundle);