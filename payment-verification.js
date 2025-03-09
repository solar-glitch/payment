require('dotenv').config(); // Load environment variables

const express = require('express');
const Razorpay = require('razorpay');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Payment Verification Service!');
});

// Create order route
app.post('/create-order', async (req, res) => {
  const options = {
    amount: 100, // Amount in paise (100 paise = 1 INR)
    currency: 'INR',
    receipt: 'receipt#1',
    payment_capture: 1
  };
  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Create payment link
app.post('/create-payment-link', async (req, res) => {
  const orderId = req.body.orderId;
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');

  try {
    const response = await axios.post('https://api.razorpay.com/v1/payment_links', {
      amount: 100, // Amount in paise (100 paise = 1 INR)
      currency: 'INR',
      accept_partial: false,
      reference_id: orderId,
      description: 'Payment for test order',
      callback_url: 'https://your-callback-url.com',
      callback_method: 'get'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Webhook route for payment verification
app.post('/verify-payment', (req, res) => {
  const { order_id, payment_id, razorpay_signature } = req.body.payload.payment.entity;

  const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
  hmac.update(order_id + '|' + payment_id);
  const generated_signature = hmac.digest('hex');

  if (generated_signature === razorpay_signature) {
    res.send('Payment verified');
  } else {
    res.status(400).send('Invalid signature');
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
