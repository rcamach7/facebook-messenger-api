exports.isAlreadyFriend = (user, id) => {
  for (let i = 0; i < user.friends.length; i++) {
    if (user.friends[i].friend.equals(id)) {
      return true;
    }
  }
  return false;
};

exports.pendingRequestExists = (user, id) => {
  for (let i = 0; i < user.sentFriendRequests.length; i++) {
    if (user.sentFriendRequests[i]._id.equals(id)) {
      return true;
    }
  }
  return false;
};
