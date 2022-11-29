import type {HydratedDocument, Types} from 'mongoose';
import type {Friendship} from './model';
import FriendshipModel from './model';
import UserCollection from '../user/collection';

/**
 * A class representing CRUD operations on a friendship.
 */
class FriendshipCollection {
  /** Operations
   *    addOne - Establish a friendship (after two users confirm their intent to befriend each other)
   *    findOneById - Find a friendship by ID
   *    findAll - Find all friendships in the database
   *    findAllFriendshipsOfUser - Find all friendships of a user (by username)
   *    deleteOne - Delete a friendship between two users (by friendship ID)
   *    deleteAllFriendshipOfUser - Delete all friendships where user is involved; used when deleting the user account
   */

  /**
   * Establish a friendship (after two users confirm their intent to befriend each other)
   *
   * @param {Types.ObjectId | string} userOneId - The first user in this friendship relationship
   * @param {Types.ObjectId | string} userTwoId - The other user in this friendship relationship
   * @return {Promise<HydratedDocument<Friendship>>} - The new friendship
   */
  static async addOne(
    userOneId: Types.ObjectId | string,
    userTwoId: Types.ObjectId | string
  ): Promise<HydratedDocument<Friendship>> {
    const dateCreated = new Date();
    const friendship = new FriendshipModel({
      userOneId,
      userTwoId,
      dateCreated
    });
    await friendship.save();
    return friendship.populate(['userOneId', 'userTwoId']);
  }

  /**
   * Find a friendship by its id
   *
   * @param {Types.ObjectId | string} friendshipId
   * @return {Promise<HydratedDocument<Post>> | Promise<null> } - The friend relation between the two users.
   */
  static async findOne(
    friendshipId: Types.ObjectId | string
  ): Promise<HydratedDocument<Friendship>> {
    return FriendshipModel.findOne({_id: friendshipId});
  }

  /**
   * Find all friendships in the database
   *
   * @return {Promise<HydratedDocument<Friendship>[]>} - An array of all of friends
   */
  static async findAll(): Promise<Array<HydratedDocument<Friendship>>> {
    return FriendshipModel.find({}).sort({dateFriendshiped: -1});
  }

  /**
   * Find all friendships where this user is involved (can be none)
   *
   * @param {string} giverId
   * @param {string} receiverId
   * @return {Promise<HydratedDocument<Friendship>[]> | Promise<null>}
   */
  static async findAllFriendshipsOfUser(username: Types.ObjectId | string): Promise<Array<HydratedDocument<Friendship>>> {
    const user = await UserCollection.findOneByUsername(username as string);
    const friendships = await FriendshipModel.find({
      $or: [{
        userOneId: user._id
      }, {
        userTwoId: user._id
      }]
    });
    return friendships;
  }

  /**
   * Delete one friend request by id.
   *
   * @param {string} username
   * @return {Promise<HydratedDocument<Friendship>[]>} - The friend relation between the two users.
   */
  static async deleteOne(
    friendshipId: Types.ObjectId | string
  ): Promise<boolean> {
    const deletedFriendRequest = await FriendshipModel.deleteOne({_id: friendshipId});
    return deletedFriendRequest !== null;
  }

  /**
  * Delete all friendships where user is involved
  *
  * @param {string} username
  * @return {Promise<void>}
  */
  static async deleteAllFriendshipOfUser(
    username: Types.ObjectId | string
  ): Promise<void> {
    const user = await UserCollection.findOneByUsername(username as string);
    // This redundancy should be ok because of the unique nature of a friendship
    await FriendshipModel.deleteMany({userOneId: user._id});
    await FriendshipModel.deleteMany({userTwoId: user._id});
  }
}

export default FriendshipCollection;