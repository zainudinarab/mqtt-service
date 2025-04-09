const express = require('express');
const bodyParser = require('body-parser');
const { publish } = require('./mqtt');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

app.post('/publish', (req, res) => {
    const { topic, message } = req.body;
    if (!topic || !message) {
        return res.status(400).json({ error: 'Topic and message required' });
    }

    publish(topic, message);
    res.json({ status: 'published', topic, message });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`🚀 MQTT controller listening on port ${PORT}`);
});
