import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import Routes from "./routes";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

const MONGO_URI = process.env.PROD_MONGO_URI;
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

// parse application/json
app.use(bodyParser.json());

mongoose
  .connect(`${MONGO_URI}`, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log("🥰 mongodb connected 🥰"))
  .catch(() =>
    console.log(
      "========== 😢 We are unable to connect to the mongo db 😢 =========="
    )
  );

app.use("/api/routes", Routes);

app.listen(PORT, () => console.log(`🔥  server running on port ${PORT}`));
