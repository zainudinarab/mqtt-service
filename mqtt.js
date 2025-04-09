const mqtt = require('mqtt');
const axios = require('axios');
require('dotenv').config();


const client = mqtt.connect(process.env.MQTT_BROKER, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
});

let currentTopics = [];

async function updateSubscriptions() {
    try {
        const res = await axios.get(`${process.env.LARAVEL_API}/api/perangkat-topics`);
        const newTopics = res.data;

        newTopics.forEach(topic => {
            if (!currentTopics.includes(topic)) {
                client.subscribe(topic, () => {
                    console.log(`Subscribed to new topic: ${topic}`);
                });
                currentTopics.push(topic);
            }
        });

        currentTopics.forEach(topic => {
            if (!newTopics.includes(topic)) {
                client.unsubscribe(topic, () => {
                    console.log(`Unsubscribed from topic: ${topic}`);
                });
            }
        });

        currentTopics = newTopics;
    } catch (err) {
        console.error('Failed to fetch topics from Laravel:', err.message);
    }
}

client.on('connect', async () => {
    console.log('✅ Connected to MQTT broker');
    await updateSubscriptions(); // initial subscribe
    setInterval(updateSubscriptions, 60 * 1000); // auto update every 60s
});

client.on('message', (topic, message) => {
    const payload = {
        topic,
        message: message.toString(),
    };
    console.log('📥 Received:', payload);

    axios.post(`${process.env.LARAVEL_API}/api/update-status-from-nodejs`, payload)
        .then(() => console.log('✅ Sent to Laravel'))
        .catch(err => console.error('❌ Failed to send to Laravel:', err.message));
});

function publish(topic, message) {
    client.publish(topic, message, {}, (err) => {
        if (err) {
            console.error('❌ Failed to publish:', err.message);
        } else {
            console.log(`📤 Published to ${topic}: ${message}`);
        }
    });
}

module.exports = { publish };
