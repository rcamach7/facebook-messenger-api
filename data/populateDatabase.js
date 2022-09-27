const axios = require("axios");
const users = require("./users.json");
const FormData = require("form-data");
const fs = require("fs").promises;
require("dotenv").config();

// Delay used to separate post creation times.
function sleep() {
  return new Promise((resolve) => setTimeout(resolve, 300000));
}

const usersData = [...users];

/**
 * This function can be ran to perform specific tasks on users that already exist, by obtaining their token.
 */
const obtainUserTokens = async () => {
  for (let i = 0; i < usersData.length; i++) {
    try {
      const {
        data: { token },
      } = await axios.post(`${process.env.API_SERVER_URL}/login/`, {
        username: usersData[i].username,
        password: usersData[i].password,
      });
      usersData[i]["token"] = token;
    } catch (error) {
      console.log(error);
    }
    console.log(`User ${usersData[i].fullName} logged in, and token saved`);
  }
};

const generateUsers = async () => {
  for (let i = 0; i < usersData.length; i++) {
    try {
      const {
        data: { token },
      } = await axios.post(`${process.env.API_SERVER_URL}/users/`, {
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
          url: `${process.env.API_SERVER_URL}/posts/`,
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
          `${process.env.API_SERVER_URL}/posts/`,
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
        url: `${process.env.API_SERVER_URL}/users/`,
        data: formData,
        headers: {
          "Content-Type": `multipart/form-data; boundary=${formData.getBoundary()}`,
          authorization: `Bearer ${usersData[i].token}`,
        },
      });
    } catch (error) {
      console.log(error);
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
    url: `${process.env.API_SERVER_URL}/posts/`,
    headers: { authorization: `bearer ${usersData[0].token}` },
  });
  const randomComments = [
    "You’re a smart cookie.",
    "You’re an awesome friend.",
    "You light up the room.",
    "You deserve a hug right now.",
    "You should be proud of yourself.",
    "You’re more helpful than you realize.",
    "You have a great sense of humor.",
    "You’ve got all the right moves!",
    "Is that your picture next to “charming” in the dictionary?",
    "Your kindness is a balm to all who encounter it.",
    "You’re all that and a super-size bag of chips.",
    "On a scale from 1 to 10, you’re an 11.",
    "You are brave.",
    "You’re even more beautiful on the inside than you are on the outside.",
    "You have the courage of your convictions.",
    "Your eyes are breathtaking.",
    "If cartoon bluebirds were real, a bunch of them would be sitting on your shoulders singing right now.",
    "You are making a difference.",
    "You’re like sunshine on a rainy day.",
    "You bring out the best in other people.",
    "Your ability to recall random factoids at just the right time is impressive.",
    "You’re a great listener.",
    "How is it that you always look great, even in sweatpants?",
    "Everything would be better if more people were like you!",
    "I bet you sweat glitter.",
    "You were cool way before hipsters were cool.",
    "That color is perfect on you.",
    "Hanging out with you is always a blast.",
    "You always know — and say — exactly what I need to hear when I need to hear it.",
    "You smell really good.",
    "You may dance like no one’s watching, but everyone’s watching because you’re an amazing dancer!",
    "Being around you makes everything better!",
    "When you say, “I meant to do that,” I totally believe you.",
    "When you’re not afraid to be yourself is when you’re most incredible.",
    "Colors seem brighter when you’re around.",
    "You’re more fun than a ball pit filled with candy. (And seriously, what could be more fun than that?)",
    "That thing you don’t like about yourself is what makes you so interesting.",
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
          `${process.env.API_SERVER_URL}/posts/${posts[i]._id}`,
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
  /**
   * 1. Create users
   * 2. Create posts
   * 3. Update profile pictures
   * 4. Add random comments
   */
  await generateUsers();
  await createPosts();
  await updateProfilePictures();
  await addRandomComments();
};

run();
