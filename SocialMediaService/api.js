const express = require("express");
const axios = require("axios");

const app = express();
const portNumber = 3000;
const apiBaseAddress = "http://20.244.56.144/evaluation-service";
const accessTokenValue ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQzNjA0MjEzLCJpYXQiOjE3NDM2MDM5MTMsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6ImY5ZjUzMGZlLThmMGQtNDI0Mi05YzdkLTQ2MWJhNWIzYWM4ZSIsInN1YiI6IjIyMDUyMDZAa2lpdC5hYy5pbiJ9LCJlbWFpbCI6IjIyMDUyMDZAa2lpdC5hYy5pbiIsIm5hbWUiOiJkZXZhbnNoIHRpd2FyaSIsInJvbGxObyI6IjIyMDUyMDYiLCJhY2Nlc3NDb2RlIjoibndwd3JaIiwiY2xpZW50SUQiOiJmOWY1MzBmZS04ZjBkLTQyNDItOWM3ZC00NjFiYTViM2FjOGUiLCJjbGllbnRTZWNyZXQiOiJmcVF0RFNKRkVUcVV0RkZoIn0.0bXkaPPw8nVElqTJy6mv1tcyqd8AtkSdPmegu8mDcd8';

const requestHeaders = {
  Authorization: "Bearer " + accessTokenValue,
  "Content-Type": "application/json",
};

app.get("/users", async function(request, response) {
  try {
    const usersApiResponse = await axios.get(apiBaseAddress + "/users", { headers: requestHeaders });
    const usersData = usersApiResponse.data.users;

    const postCountsData = {};
    for (const userId in usersData) {
      const postsApiResponse = await axios.get(apiBaseAddress + "/users/" + userId + "/posts", { headers: requestHeaders });
      postCountsData[userId] = postsApiResponse.data.posts.length;
    }

    let topUsersList = [];
    let usersAndCounts = [];

    for (const userId in postCountsData) {
      usersAndCounts.push([userId, postCountsData[userId]]);
    }

    usersAndCounts.sort(function(a, b) {
      return b[1] - a[1];
    });

    let topFive = usersAndCounts.slice(0, 5);

    for (const userCount of topFive) {
      let userId = userCount[0];
      let postCount = userCount[1];
      let userName = usersData[userId];

      topUsersList.push({ id: userId, name: userName, postCount: postCount });
    }

    response.json({ topUsers: topUsersList });

  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

app.get("/posts", async function(request, response) {
  try {
    let requestedType = request.query.type;
    if (!requestedType || (requestedType !== "latest" && requestedType !== "popular")) {
      return response.status(400).json({ error: "Invalid type parameter" });
    }

    const usersApiResponse = await axios.get(apiBaseAddress + "/users", { headers: requestHeaders });
    const allUserIds = Object.keys(usersApiResponse.data.users);

    let allPosts = [];
    for (const userId of allUserIds) {
      const postsApiResponse = await axios.get(apiBaseAddress + "/users/" + userId + "/posts", { headers: requestHeaders });
      allPosts = allPosts.concat(postsApiResponse.data.posts);
    }

    if (requestedType === "latest") {
      allPosts.sort(function(a, b) {
        return b.id - a.id;
      });
      let latestFive = allPosts.slice(0, 5);
      return response.json({ latestPosts: latestFive });
    }

    let popularPostsFound = [];
    let mostComments = 0;
    for (const post of allPosts) {
      const commentsApiResponse = await axios.get(apiBaseAddress + "/posts/" + post.id + "/comments", { headers: requestHeaders });
      let commentCount = commentsApiResponse.data.comments.length;

      if (commentCount > mostComments) {
        mostComments = commentCount;
        popularPostsFound = [post];
      } else if (commentCount === mostComments) {
        popularPostsFound.push(post);
      }
    }

    response.json({ popularPosts: popularPostsFound });

  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

app.listen(portNumber, function() {
  console.log("Server running on port " + portNumber);
});