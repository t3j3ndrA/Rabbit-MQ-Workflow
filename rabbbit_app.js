import express from "express";
const app = express();
import bodyParser from "body-parser";
import cors from "cors";
import env from "dotenv";
import mongoose from "mongoose";
env.config();
import amqp from "amqplib/callback_api.js";

app.use(bodyParser.json());
app.use(cors());
app.use(express.json());
const port = process.env.PORT | 5000;

app.post("/", (req, res) => {
	amqp.connect(process.env.RABBITMQ_URI, function (error0, connection) {
		if (error0) {
			throw error0;
		}
		connection.createChannel(function (error1, channel) {
			if (error1) {
				throw error1;
			}
			// if rest queue does not exist then create new one
			// durable : true implies queue does not destroys even when server goes down
			channel.assertQueue("rest-post", {
				durable: true,
			});

			// now we have queue is read
			// put the data in the queue
			channel.sendToQueue("rest-post", Buffer.from(JSON.stringify(req.body)));
		});

		// A queue which recieves the data and sends respose according

		connection.createChannel((err, channel) => {
			if (err) throw err;
			channel.assertQueue("rest-post", { durable: true });
			channel.consume("rest-post", (data) => {
				console.log("data at rest = ", JSON.parse(data.content.toString()));
				res.json({ Rec: JSON.parse(data.content.toString()) });
				channel.close();
			});
		});

		// connection.createChannel(function (error1, channel) {
		// 	if (error1) {
		// 		throw error1;
		// 	}

		// 	channel.assertQueue("reply");

		// 	channel.consume(
		// 		"reply",
		// 		(msg) => {
		// 			res.json(msg);
		// 		},
		// 		{
		// 			noAck: true,
		// 		}
		// 	);
		// });
	});
});

app.listen(port, () => console.log(`Server is up and running on ${port}`));
