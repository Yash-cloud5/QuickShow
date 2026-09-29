import express from "express";
import { createBooking, getOccupiedSeats, payBooking, verifyPayment } from "../controllers/bookingContoller.js";
const bookingRouter = express.Router();
bookingRouter.post('/create', createBooking);
bookingRouter.post('/pay', payBooking);
bookingRouter.post('/verify-payment', verifyPayment);
bookingRouter.get('/seats/:showId', getOccupiedSeats);

export default bookingRouter;