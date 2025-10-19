const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'order-service',
  brokers: [process.env.KAFKA_URL || '127.0.0.1:9092']
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'order-service-group' });

const connectKafka = async () => {
  try {
    await producer.connect();
    await consumer.connect();
    console.log('✅ Kafka connected successfully');
  } catch (error) {
    console.warn('⚠️ Kafka connection failed (continuing without Kafka):', error.message);
    // Don't throw error, continue without Kafka
  }
};

const disconnectKafka = async () => {
  try {
    await producer.disconnect();
    await consumer.disconnect();
    console.log('✅ Kafka disconnected successfully');
  } catch (error) {
    console.error('❌ Kafka disconnection error:', error);
  }
};

const sendEvent = async (topic, message) => {
  try {
    await producer.send({
      topic,
      messages: [{
        key: message.id || Date.now().toString(),
        value: JSON.stringify(message)
      }]
    });
    console.log(`📤 Event sent to ${topic}:`, message);
  } catch (error) {
    console.error('❌ Error sending event:', error);
  }
};

const subscribeToTopic = async (topic, callback) => {
  try {
    await consumer.subscribe({ topic });
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const data = JSON.parse(message.value.toString());
          console.log(`📥 Event received from ${topic}:`, data);
          await callback(data);
        } catch (error) {
          console.error('❌ Error processing message:', error);
        }
      }
    });
    console.log(`✅ Subscribed to topic: ${topic}`);
  } catch (error) {
    console.error('❌ Error subscribing to topic:', error);
  }
};

module.exports = {
  connectKafka,
  disconnectKafka,
  sendEvent,
  subscribeToTopic
};
