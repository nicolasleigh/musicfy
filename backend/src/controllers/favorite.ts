import { PopulatedFavoriteList } from "#/@types/audio";
import { paginationQuery } from "#/@types/other";
import Audio, { AudioDocument } from "#/models/audio";
import Favorite from "#/models/favorite";
import { RequestHandler } from "express";
import { ObjectId, isValidObjectId } from "mongoose";

export const toggleFavorite: RequestHandler = async (req, res) => {
  const audioId = req.query.audioId as string;
  let status: "added" | "removed";

  if (!isValidObjectId(audioId)) return res.status(422).json({ error: "Invalid audio id!" });

  const audio = await Audio.findById(audioId);
  if (!audio) return res.status(404).json({ error: "Audio not found!" });

  const alreadyExists = await Favorite.findOne({
    owner: req.user.id,
    items: audioId,
  });

  if (alreadyExists) {
    await Favorite.updateOne(
      { owner: req.user.id },
      {
        $pull: { items: audioId },
      }
    );
    status = "removed";
  } else {
    const favorite = await Favorite.findOne({ owner: req.user.id });
    if (favorite) {
      await Favorite.updateOne(
        { owner: req.user.id },
        {
          $addToSet: { items: audioId },
        }
      );
    } else {
      await Favorite.create({ owner: req.user.id, items: [audioId] });
    }
    status = "added";
  }

  if (status === "added") {
    await Audio.findByIdAndUpdate(audioId, {
      $addToSet: { likes: req.user.id },
    });
  }

  if (status === "removed") {
    await Audio.findByIdAndUpdate(audioId, {
      $pull: { likes: req.user.id },
    });
  }
  res.json({ status });
};

export const addFavorite: RequestHandler = async (req, res) => {
  const audioId = req.query.audioId as string;

  if (!isValidObjectId(audioId)) return res.status(422).json({ error: "Invalid audio id!" });

  const audio = await Audio.findById(audioId);
  if (!audio) return res.status(404).json({ error: "Audio not found!" });

  const alreadyExists = await Favorite.findOne({
    owner: req.user.id,
    items: audioId,
  });

  if (alreadyExists) {
    return res.json({ message: "Already in your favorites", toast: "info" });
  } else {
    const favorite = await Favorite.findOne({ owner: req.user.id });
    if (favorite) {
      await Favorite.updateOne(
        { owner: req.user.id },
        {
          $addToSet: { items: audioId },
        }
      );
    } else {
      await Favorite.create({ owner: req.user.id, items: [audioId] });
    }
  }

  await Audio.findByIdAndUpdate(audioId, {
    $addToSet: { likes: req.user.id },
  });

  res.json({ message: "Added to your favorites successfully", toast: "success" });
};

export const getFavorites: RequestHandler = async (req, res) => {
  const userId = req.user.id;
  const { limit = "20", pageNo = "0" } = req.query as paginationQuery;

  const favorites = await Favorite.aggregate([
    { $match: { owner: userId } },
    {
      $project: {
        audioIds: {
          $slice: ["$items", parseInt(limit) * parseInt(pageNo), parseInt(limit)],
        },
      },
    },
    { $unwind: "$audioIds" },
    {
      $lookup: {
        from: "audios",
        localField: "audioIds",
        foreignField: "_id",
        as: "audioInfo",
      },
    },
    { $unwind: "$audioInfo" },
    {
      $lookup: {
        from: "users",
        localField: "audioInfo.owner",
        foreignField: "_id",
        as: "ownerInfo",
      },
    },
    { $unwind: "$ownerInfo" },
    {
      $project: {
        _id: 0,
        id: "$audioInfo._id",
        title: "$audioInfo.title",
        category: "$audioInfo.category",
        about: "$audioInfo.about",
        file: "$audioInfo.file.url",
        publicId: "$audioInfo.file.publicId",
        poster: "$audioInfo.poster.url",
        owner: { name: "$ownerInfo.name", id: "$ownerInfo._id" },
      },
    },
  ]);

  return res.json({ audios: favorites });

  // const favorite = await Favorite.findOne({ owner: userId }).populate<{
  //   items: PopulatedFavoriteList[];
  // }>({
  //   path: 'items',
  //   populate: {
  //     path: 'owner',
  //   },
  // });

  // if (!favorite) return res.json({ audio: [] });

  // const audios = favorite.items.map((item) => {
  //   return {
  //     id: item._id,
  //     title: item.title,
  //     category: item.category,
  //     file: item.file.url,
  //     poster: item.poster?.url,
  //     owner: { name: item.owner.name, id: item.owner._id },
  //   };
  // });

  // res.json({ audios });
};

export const getIsFavorite: RequestHandler = async (req, res) => {
  const audioId = req.query.audioId as string;

  if (!isValidObjectId(audioId)) return res.status(422).json({ error: "Invalid audio id!" });

  const favorite = await Favorite.findOne({
    owner: req.user.id,
    items: audioId,
  });

  res.json({ result: favorite ? true : false });
};
