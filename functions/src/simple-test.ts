import {onRequest} from "firebase-functions/v2/https";

export const helloWorld = onRequest({cors: true}, (req, res) => {
  res.json({message: "Hello from Firebase Functions!"});
});
