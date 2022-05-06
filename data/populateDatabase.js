const config = require("../config.json");
const axios = require("axios");
const users = require("./users.json");
const FormData = require("form-data");
const fs = require("fs").promises;

// Delay used to separate post creation times.
function sleep() {
  return new Promise((resolve) => setTimeout(resolve, 300000));
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
    if (i + 1 === usersData.length) {
      continue;
    } else {
      await sleep();
    }
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
    "Hey there!",
    "You're a smart cookie",
    "Very funny",
    "Haven't heard from you in a while!",
    "You've got all the right moves",
    "Woo!",
    "Nice!",
    "You always know — and say — exactly what I need to hear when I need to hear it.",
    "What a post!",
    "Sweet",
    "Your perspective is refreshing",
    "Interesting...",
    "Wait I don't understand...",
    "Lets go!",
    "Brilliant!",
    "Very funny!",
  ];

  for (let i = 1; i < posts.length; i++) {
    // Generate two random comments per post.
    for (let j = 0; j < 3; j++) {
      // Make sure we aren't commenting on our own post.
      let randomUsersIndex = Math.floor(Math.random() * usersData.length);
      while (
        posts[i].postedBy.fullName === usersData[randomUsersIndex].fullName
      ) {
        randomUsersIndex = Math.floor(Math.random() * usersData.length);
      }

      let randomUserToken = usersData[randomUsersIndex].token;
      const myComment =
        randomComments[Math.floor(Math.random() * randomComments.length)];
      try {
        await axios.put(
          `${config.apiUrl}/posts/${posts[i]._id}`,
          { comment: myComment },
          { headers: { authorization: `Bearer ${randomUserToken}` } }
        );
      } catch (error) {
        console.log(error.response);
        console.log("error generating random comment");
      }
    }
    console.log("done generating two comments for one post");
  }
};

const run = async () => {
  await generateUsers();
  await createPosts();
  await updateProfilePictures();
  await addRandomComments();
};

run();
