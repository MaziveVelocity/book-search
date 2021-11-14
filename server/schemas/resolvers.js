const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require('../utils/auth');
const { User, Book } = require('../models');

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            const userData = await User.findOne({ _id: context.user._id })
                .select('-__v -password')
                .populate('savedBooks')

            return userData;
        }
    },

    Mutation: {
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });

            if (!user) {
                throw new AuthenticationError('Incorrect credentials');
            }

            const correctPw = await user.isCorrectPassword(password);

            if (!correctPw) {
                throw new AuthenticationError('Incorrect credentials');
            }

            const token = signToken(user);
            return { token, user };
        },

        addUser: async (parent, args) => {
            const user = await User.create({...args});
            const token = signToken(user);

            return { token, user };
        },

        saveBook: async (parent, args, context) => {
            const user = await User.findByIdAndUpdate(
                { _id: context.user._id },
                { $push: { savedBooks: args.input } },
                { new: true }
            );
            return user;
        },

        removeBook: async (parent, args, context) => {
            const user = await User.findByIdAndUpdate(
                { _id: context.user._id },
                { $pull: { savedBooks: { bookId: args.bookId } } },
                { new: true }
            );
            return user;
        },
    }
}

module.exports = resolvers;