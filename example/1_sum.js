const babex = require('../index');
const exchange = 'math';
const routingKey = 'math.sum';
const config = babex.config;
config.name = 'math.sum';
config.address = process.env.RMQ_ADDRESS || 'amqp://localhost';
config.logger = babex.logger;

babex
    .newService(config)
    .then((service) => service
        .bindToExchange(exchange, routingKey)
        .then((service) => service
            .listen((message) => {
                let payload = {
                    c: message.data.a + message.data.b
                };

                service.next(message, payload);
            })
        )
    )
    .catch(console.warn);