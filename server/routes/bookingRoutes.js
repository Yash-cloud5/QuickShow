import express from "express";
import { createBooking, getOccupiedSeats, payBooking } from "../controllers/bookingContoller.js";
const bookingRouter = express.Router();
bookingRouter.post('/create', createBooking);
bookingRouter.post('/pay', payBooking);
bookingRouter.get('/seats/:showId', getOccupiedSeats);

export default bookingRouter;