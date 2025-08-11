#!/bin/bash
URL="http://localhost:3000/webhooks"
DATA='{
  "contacts": {
    "add": [{
      "id": 5001,
      "name": "Тест Контакт",
      "custom_fields": [{
        "code": "PHONE",
        "values": [{"value": "+79160000001"}]
      }]
    }]
  }
}'

curl -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d "$DATA"