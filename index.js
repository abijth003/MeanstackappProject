const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/otpAuth', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Define the OTP Schema
const otpSchema = new mongoose.Schema({
    email: String,
    otp: String,
});
const Otp = mongoose.model('Otp', otpSchema);

// Set up Nodemailer
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'your-email@gmail.com',  // Replace with your email
        pass: 'your-email-password',     // Replace with your password
    },
});

// Route to send OTP
app.post('/api/send-otp', async (req, res) => {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.findOneAndUpdate({ email }, { otp }, { upsert: true });

    const mailOptions = {
        from: 'your-email@gmail.com',
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is ${otp}`,
    };

    transporter.sendMail(mailOptions, (error) => {
        if (error) return res.status(500).send(error.toString());
        res.status(200).send('OTP sent');
    });
});

// Route to verify OTP
app.post('/api/verify-otp', async (req, res) => {
    const { otp } = req.body;
    const record = await Otp.findOne({ otp });

    if (record) {
        await Otp.deleteOne({ otp }); // Optionally delete after verification
        return res.send({ success: true });
    }
    res.send({ success: false });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
