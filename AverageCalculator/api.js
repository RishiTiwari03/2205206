const express = require("express");
const axios = require("axios");

const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQzNjA0NzkzLCJpYXQiOjE3NDM2MDQ0OTMsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6ImY5ZjUzMGZlLThmMGQtNDI0Mi05YzdkLTQ2MWJhNWIzYWM4ZSIsInN1YiI6IjIyMDUyMDZAa2lpdC5hYy5pbiJ9LCJlbWFpbCI6IjIyMDUyMDZAa2lpdC5hYy5pbiIsIm5hbWUiOiJkZXZhbnNoIHRpd2FyaSIsInJvbGxObyI6IjIyMDUyMDYiLCJhY2Nlc3NDb2RlIjoibndwd3JaIiwiY2xpZW50SUQiOiJmOWY1MzBmZS04ZjBkLTQyNDItOWM3ZC00NjFiYTViM2FjOGUiLCJjbGllbnRTZWNyZXQiOiJmcVF0RFNKRkVUcVV0RkZoIn0.yGEhYoNtKVriy9zbvBzwX1pMKGZm8j4fMhoqESBzU5A';

const app = express();
const portNumber = 3000;

app.listen(portNumber, function() {
  console.log("Server is running on port " + portNumber);
});

const windowSize = 10;
const apiUrls = {
    p: "http://20.244.56.144/evaluation-service/primes",
    f: "http://20.244.56.144/evaluation-service/fibo",
    e: "http://20.244.56.144/evaluation-service/even",
    r: "http://20.244.56.144/evaluation-service/rand"
};

const numberStorageData = {
  p: [],
  f: [],
  e: [],
  r: []
};

async function getNumberList(type) {
  try {
    const apiResponse = await axios.get(apiUrls[type], {
      timeout: 500,
      headers: { Authorization: "Bearer " + apiKey }
    });
    if(apiResponse.data && apiResponse.data.numbers) {
      return apiResponse.data.numbers;
    } else {
      return [];
    }
  } catch (error) {
    return [];
  }
}

app.get("/numbers/:type", async function(request, response) {
  const requestType = request.params.type;
  if (!apiUrls[requestType]) {
    return response.status(400).json({ error: "Invalid type. Use 'p', 'f', 'e', or 'r'." });
  }

  let previousState = [];
  for(let i = 0; i < numberStorageData[requestType].length; i++){
    previousState.push(numberStorageData[requestType][i]);
  }

  const freshNumbers = await getNumberList(requestType);

  if (freshNumbers.length > 0) {
    for (const number of freshNumbers) {
      if (numberStorageData[requestType].indexOf(number) === -1) {
        numberStorageData[requestType].push(number);
        if (numberStorageData[requestType].length > windowSize) {
          numberStorageData[requestType].shift();
        }
      }
    }
  }

  let totalSum = 0;
  for(let i = 0; i < numberStorageData[requestType].length; i++){
    totalSum = totalSum + numberStorageData[requestType][i];
  }

  let averageValue = "0.00";
  if (numberStorageData[requestType].length > 0) {
    averageValue = (totalSum / numberStorageData[requestType].length).toFixed(2);
  }

  let currentState = [];
  for(let i = 0; i < numberStorageData[requestType].length; i++){
    currentState.push(numberStorageData[requestType][i]);
  }

  response.json({
    windowPrevState: previousState,
    windowCurrState: currentState,
    numbers: freshNumbers,
    avg: parseFloat(averageValue)
});
});
