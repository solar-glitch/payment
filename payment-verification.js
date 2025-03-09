const express = require('express');
const Razorpay = require('razorpay');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
app.use(bodyParser.json());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Define a route for the root URL
app.get('/', (req, res) => {
  res.send('Welcome to the Payment Verification Service!');
});

app.post('/create-order', async (req, res) => {
  const options = {
    amount: req.body.amount * 100, // amount in the smallest currency unit
    currency: 'INR',
    receipt: 'receipt#1'
  };
  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Update the webhook route to handle webhook requests
app.post('/verify-payment', (req, res) => {
  const webhookPayload = req.body.payload.payment.entity;
  const { order_id, payment_id, signature } = webhookPayload;

  const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
  hmac.update(order_id + '|' + payment_id);
  const generated_signature = hmac.digest('hex');

  if (generated_signature === signature) {
    res.send('Payment verified');
  } else {
    res.status(400).send('Invalid signature');
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
