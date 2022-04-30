const config = require("../config.json");
const axios = require("axios");
const users = require("./users.json");

const usersData = [...users];

// Delay used to separate post creation times.
const DEF_DELAY = 130000;
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms || DEF_DELAY));
}

const generateUsersAndPosts = async () => {
  for (let i = 0; i < usersData.length; i++) {
    try {
      const {
        data: { token },
      } = await axios.post(`${config.apiUrl}/users/`, {
        username: usersData[i].username,
        password: usersData[i].password,
        fullName: usersData[i].fullName,
      });
      // Save Token
      usersData[i]["token"] = token;

      // Create Post
      try {
        await axios.post(
          `${config.apiUrl}/posts/`,
          {
            description: usersData[i].post.description,
          },
          { headers: { authorization: `Bearer ${usersData[i].token}` } }
        );
      } catch (error) {
        console.log(error);
      }
    } catch (error) {
      console.log(error);
    }
    console.log(`finished adding ${usersData[i].fullName}`);
    // Spread creation times
    await sleep();
  }
};

const run = async () => {
  await generateUsersAndPosts();
};

/**
 * Attempt to make request with image - not working.
const FormData = require("form-data");
const fs = require("fs").promises;

try {
  const image = await fs.readFile("space.jpeg", { encoding: "base64" });
  const formData = new FormData();
  formData.append("picture", image);
  formData.append("description", usersData[i].post.description);

  await axios({
    method: "post",
    url: `${config.apiUrl}/posts/`,
    data: formData,
    headers: {
      "Content-Type": `multipart/form-data; boundary=${formData.getBoundary()}`,
      authorization: `Bearer ${usersData[i].token}`,
    },
  });
} catch (error) {
  console.log(error);
}
 */

run();
