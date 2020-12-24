require("dotenv").config();
import express from "express";
import Twilio from "twilio";
import { Movie, testData } from "./schema";

const app = express();

app.get("/create-movies", (req, res) => {
  // const length = testData.length;
  // testData.forEach((data, index) => {
  //   const newMovie = new Movie({
  //     title: data.title,
  //     rating: data.rating,
  //     release_subscribers: data.release_subscribers,
  //     category: data.category,
  //     release_date: data.release_date,
  //     synopsis: data.synopsis,
  //     img_uri: data.img_uri,
  //   });
  //   newMovie
  //     .save()
  //     .then(
  //       () =>
  //         length === index + 1 && res.status(200).send({ data: "COMPLETED" })
  //     )
  //     .catch((e) => console.log(e));
  // });
});

app.get("/get-movies", (req, res) => {
  Movie.find({}, (error, data) => {
    if (error) {
      res.status(404).send({ error: `Movies not found` });
    }

    res.status(200).send({ data });
  });
});

app.post("/verify-number", (req, res) => {
  const { mobileNumber, countryCode } = req.body;

  const accountSID = process.env.SID;
  const authToken = process.env.TOKEN;
  const SERVICEID = process.env.SERVICEID;
  const twillioClient = Twilio(accountSID, authToken);

  twillioClient.verify
    .services(SERVICEID)
    .verifications.create({
      to: `+${countryCode}${mobileNumber}`,
      channel: "sms",
    })
    .then((response) => res.status(200).send({ data: response }))
    .catch((e) => {
      console.log(e);
      res.status(422).send({ error: e });
    });
});

app.post("/add-verified-subscriber", async (req, res) => {
  const { countryCode, mobileNumber, verificationCode, movieId } = req.body;
  const accountSID = process.env.SID;
  const authToken = process.env.TOKEN;
  const SERVICEID = process.env.SERVICEID;
  const twillioClient = Twilio(accountSID, authToken);

  const recipientNumber = `+${countryCode}${mobileNumber}`;

  twillioClient.verify
    .services(SERVICEID)
    .verificationChecks.create({
      to: recipientNumber,
      code: verificationCode,
    })
    .then((twilioResponse) => {
      Movie.findByIdAndUpdate(
        movieId,
        { release_subscribers: [recipientNumber] },
        (err) => {
          if (err) {
            res.status(404).send({ error: `Movie: ${movieId} not found` });
          }

          res.status(200).send({ status: twilioResponse.status });
        }
      );
    })
    .catch((e) => res.status(422).send({ error: e }));
});

app.post("/send-release-notification", (req, res) => {
  const { movieName } = req.body;

  const accountSID = process.env.SID;
  const authToken = process.env.TOKEN;
  const twillioClient = Twilio(accountSID, authToken);

  Movie.findOne({ title: movieName }, (error, data) => {
    if (error) {
      res.status(404).send({ error: `movie : ${movieName} not found` });
    }

    Promise.all(
      data.release_subscribers.map((number) =>
        twillioClient.messages.create({
          to: number,
          from: process.env.MESSAGING_SID,
          body: `Your ${data.category} movie ${data.title}, was released today`,
        })
      )
    )
      .then(() => {
        res.status(200).send({ status: "MESSAGES SENT" });
      })
      .catch((err) => console.error(err));
  });
});

export default app;
