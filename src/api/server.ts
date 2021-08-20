import * as express from 'express';
import * as cors from "cors";
import * as mongoose from "mongoose";
import { json } from 'body-parser';
import Bundle from './bundle.model';

const dbRoutes = express.Router();
const app = express();
const PORT = 4000;

app.use(cors());
app.use(json());


mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
});
const connection = mongoose.connection;

connection.once('open', function () {
    console.log("MongoDB database connection established successfully");
})


dbRoutes.route('/bundles').get(function (req, res) {
    Bundle.find(function (err, bundles) {
        if (err) {
            console.log(err);
        } else {
            res.json(bundles);
        }
    });
});

dbRoutes.route('/bundles/:id').get(function (req, res) {
    let id = req.params.id;
    Bundle.findById(id, function (err, load) {
        res.json(load);
    });
});

dbRoutes.route('/bundles/add').post(function (req, res) {
    let bundle = new Bundle(req.body);
    bundle.save()
        .then(bundle => {
            res.status(200).json({ 'load': 'load added successfully' });
        })
        .catch(bundle => {
            res.status(400).send('adding new load failed');
        });
});


app.use('/db', dbRoutes);

app.listen(PORT, function () {
    console.log("Server is running on Port: " + PORT);
});