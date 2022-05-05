const config = require("../config.json");
const axios = require("axios");
const users = require("./users.json");
const FormData = require("form-data");
const fs = require("fs").promises;

// Delay used to separate post creation times.
function sleep() {
  return new Promise((resolve) => setTimeout(resolve, 13));
}
const usersData = [...users];
const generateUsers = async () => {
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
    } catch (error) {
      console.log(error);
    }
    console.log(`User ${usersData[i].fullName} created`);
  }
};

const createPosts = async () => {
  for (let i = 0; i < usersData.length; i++) {
    // Check if user will be submitting a picture post.
    if (usersData[i].post.imageName !== null) {
      try {
        const formData = new FormData();
        const image = await fs.readFile(usersData[i].post.imageName);

        formData.append("picture", image, {
          filename: usersData[i].post.imageName,
          contentType: "application/octet-stream",
          mimeType: "image/png",
        });
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
        console.log("error creating picture post");
      }
    } else {
      // Handle regular text post
      try {
        await axios.post(
          `${config.apiUrl}/posts/`,
          {
            description: usersData[i].post.description,
          },
          { headers: { authorization: `Bearer ${usersData[i].token}` } }
        );
      } catch (error) {
        console.log("error creating text post");
      }
    }

    console.log(`finished making a posting under ${usersData[i].fullName}`);
    // Spread posts by delaying next iteration.
    await sleep();
  }
};

const updateProfilePictures = async () => {
  for (let i = 0; i < usersData.length; i++) {
    // Check if user will be submitting a picture post.
    try {
      const formData = new FormData();
      const image = await fs.readFile(usersData[i].profilePicture);

      formData.append("profilePicture", image, {
        filename: usersData[i].username,
        contentType: "application/octet-stream",
        mimeType: "image/png",
      });

      await axios({
        method: "put",
        url: `${config.apiUrl}/users/`,
        data: formData,
        headers: {
          "Content-Type": `multipart/form-data; boundary=${formData.getBoundary()}`,
          authorization: `Bearer ${usersData[i].token}`,
        },
      });
    } catch (error) {
      console.log("error changing user image");
    }
    console.log(`profile picture updated for ${usersData[i].fullName}`);
  }
};

// Does not yet deal with users potentially commenting on their own posts.
// Only generates one comment per post.
const addRandomComments = async () => {
  // Use first users token to get access to all posts
  const {
    data: { posts },
  } = await axios({
    method: "get",
    url: `${config.apiUrl}/posts/`,
    headers: { authorization: `bearer ${usersData[0].token}` },
  });
  const randomComments = [
    "Wo that's awesome",
    "Hey people",
    "Very funny",
    "Haven't heard from you in a while!",
    "Hello World",
  ];

  for (let i = 0; i < posts.length; i++) {
    const myComment =
      randomComments[Math.floor(Math.random() * randomComments.length)];
    const randomUserToken =
      usersData[Math.floor(Math.random() * usersData.length)].token;

    try {
      await axios.put(
        `${config.apiUrl}/posts/${posts[i]._id}`,
        { comment: myComment },
        { headers: { authorization: `Bearer ${randomUserToken}` } }
      );
    } catch (error) {
      console.log("error generating random comment");
    }
    console.log("done generating a comment for one post");
  }
};

const run = async () => {
  await generateUsers();
  await createPosts();
  await updateProfilePictures();
  await addRandomComments();
};

run();
