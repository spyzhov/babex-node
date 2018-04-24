# About

Имплементация протокола общения между сервисами, через очередь сообщений RabbitMQ.

# Versions

## Version 1

Input message:
```
{
  "data": Any,
  "chain": [Path]
}
```

Where `Path` like:
```
{
  "exchange": String,
  "key": String,
  "isMultiple": Bool,
  "successful": Bool
}
```

# Example

Service example `Sum(a, b)`:

Request:
```json
{
  "data": {
    "a": 2, 
    "b": 3
  },
  "chain": [
    {
      "exchange": "Math",
      "key": "sum",
      "isMultiple": false,
      "successful": false
    },
    {
      "exchange": "Math",
      "key": "sum.next",
      "isMultiple": false,
      "successful": false
    }
  ]
}
```

```js
const babex = require('babex-node');
const exchange = 'Math';
const routingKey = 'sum';
const config = babex.config;
config.name = 'Math.sum';
config.address = process.env.RMQ_ADDRESS;

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
```

Result:
```json
{
  "data": {
    "c": 5
  },
  "chain": [
    {
      "exchange": "Math",
      "key": "sum",
      "isMultiple": false,
      "successful": true
    },
    {
      "exchange": "Math",
      "key": "sum.next",
      "isMultiple": false,
      "successful": false
    }
  ]
}
```
