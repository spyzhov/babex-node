# About

`Babex` is a modern solution for communications between microservices.

# Versions

## Version 1

Input message:
```
{
  "data": Any,
  "chain": [Path],
  "config": Any
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
      "exchange": "math",
      "key": "sum",
      "isMultiple": false
    },
    {
      "exchange": "math",
      "key": "sum.next",
      "isMultiple": false
    }
  ],
  "config": null
}
```

```js
const babex = require('babex-node');
const exchange = 'math';
const routingKey = 'sum';
const config = babex.config;
config.name = 'math.sum';
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
      "exchange": "math",
      "key": "sum",
      "isMultiple": false,
      "successful": true
    },
    {
      "exchange": "math",
      "key": "sum.next",
      "isMultiple": false,
      "successful": false
    }
  ],
  "config": null
}
```
