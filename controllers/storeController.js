const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    if (isPhoto) {
      next(null, true);
    } else {
      next({ message: 'That filetype isn\'t allowed!' }, false);
    }
  },
};

exports.homePage = (req, res) => {
  res.render('index');
};

exports.addStore = (req, res) => {
  res.render('editStore', {
    title: 'Add Store',
  }); 
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
  // check if theres no new file
  if (!req.file) next();

  // Rename image
  const extension = req.file.mimetype.split('/')[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  console.log(req.body.photo);
  // Resize image
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  // After saving
  next();
};

exports.createStore = async (req, res) => {
  const store = await (new Store(req.body)).save();  
  req.flash('success', `Successfully Created <strong>${store.name}</strong>. Care to leave a review?`);
  res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
  // 1. Query the database for a list of all stores
  const stores = await Store.find();
  res.render('stores', { title: 'Stores', stores });
};

exports.editStore = async (req, res) => {
  // 1. Find the store by ID
  const store = await Store.findOne({ _id: req.params.id });
  // 2. TODO: Confirm they are the owner of the store
  // 3. Render the edit form so the user can update the store
  res.render('editStore', {
    title: `Edit ${store.name}`,
    store,
  });
};

exports.updateStore = async (req, res) => {
  // Set the location data to be a point
  req.body.location.type = 'Point';
  // Find and update the store
  const store = await Store.findOneAndUpdate({
    _id: req.params.id
  }, 
  req.body, 
  {
    new: true,
    runValidators: true,
  }).exec();
  // Redirect them to the store and tell them it worked
  req.flash('success', `Succesfully updated <strong>${store.name}<strong>. <a href="/stores/${store.slug}">View Store -></a>`);
  res.redirect(`/stores/${store._id}/edit`);
};

